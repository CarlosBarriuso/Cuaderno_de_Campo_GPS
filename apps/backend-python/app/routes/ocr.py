"""
OCR routes - Optical Character Recognition for agricultural products
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from PIL import Image
import pytesseract
import numpy as np
import re
from loguru import logger
from typing import Dict, List
import io

# Importación condicional de OpenCV
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logger.warning("OpenCV not available. OCR functionality may be limited.")

router = APIRouter()


@router.post("/process")
async def process_ocr(file: UploadFile = File(...)):
    """Process image with OCR to extract agricultural product information"""
    
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": "Invalid file type",
                    "message": "Only image files are supported"
                }
            )
        
        # Read image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Process image for OCR
        if CV2_AVAILABLE:
            # Convert to OpenCV format
            opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            # Preprocess image for better OCR
            processed_image = preprocess_image(opencv_image)
            # Perform OCR
            extracted_text = pytesseract.image_to_string(processed_image, lang='spa')
        else:
            # Use PIL directly without OpenCV preprocessing
            extracted_text = pytesseract.image_to_string(image, lang='spa')
        
        # Extract product information using patterns
        product_info = extract_product_patterns(extracted_text)
        
        # Calculate confidence
        confidence = calculate_confidence(extracted_text, product_info)
        
        result = {
            "success": True,
            "data": {
                "filename": file.filename,
                "file_size": len(image_data),
                "extracted_text": extracted_text.strip(),
                "confidence": confidence,
                "products": product_info,
                "metadata": {
                    "image_dimensions": f"{image.width}x{image.height}",
                    "processing_time": "estimated",
                    "provider": "pytesseract"
                }
            }
        }
        
        logger.info(f"OCR processed successfully for file: {file.filename}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR processing error for {file.filename}: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "OCR processing failed",
                "message": str(e)
            }
        )


@router.post("/batch")
async def process_batch_ocr(files: List[UploadFile] = File(...)):
    """Process multiple images with OCR"""
    
    if len(files) > 5:
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "error": "Too many files",
                "message": "Maximum 5 files allowed per batch"
            }
        )
    
    results = []
    
    for file in files:
        try:
            # Process each file
            result = await process_ocr(file)
            results.append({
                "filename": file.filename,
                "status": "success",
                "data": result["data"]
            })
        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "error",
                "error": str(e)
            })
    
    return {
        "success": True,
        "data": {
            "processed_files": len(results),
            "results": results
        }
    }


@router.get("/patterns")
async def get_product_patterns():
    """Get available product recognition patterns"""
    
    patterns = {
        "success": True,
        "data": {
            "herbicidas": [
                "glifosato", "2,4-d", "dicamba", "atrazina", "paraquat",
                "roundup", "garlon", "tordon"
            ],
            "fungicidas": [
                "mancozeb", "copper", "cobre", "azufre", "sulfur",
                "benomilo", "captan", "thiram"
            ],
            "insecticidas": [
                "imidacloprid", "clorpirifos", "lambda", "bifentrin",
                "malation", "carbaril", "rotenona"
            ],
            "fertilizantes": [
                "urea", "superfosfato", "potasio", "nitrato",
                "15-15-15", "20-10-10", "npk"
            ],
            "growth_regulators": [
                "giberelina", "auxina", "citoquinina", "aba"
            ],
            "patterns": {
                "registro_sanitario": r"R\.S\.\s*[A-Z]*\s*\d+[/-]\d+",
                "dosis": r"\d+[\.,]?\d*\s*(ml|l|g|kg|cc)(?:/ha|/100l)?",
                "concentracion": r"\d+[\.,]?\d*\s*%",
                "plazo_seguridad": r"\d+\s*d[íi]as?",
                "npk": r"\d{1,2}[-:]\d{1,2}[-:]\d{1,2}"
            }
        }
    }
    
    return patterns


def preprocess_image(image):
    """Preprocess image for better OCR accuracy"""
    if not CV2_AVAILABLE:
        return image
    
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Apply threshold to get binary image
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Apply morphological operations to clean up
    kernel = np.ones((2, 2), np.uint8)
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    
    # Resize if image is too small
    height, width = cleaned.shape
    if height < 300 or width < 300:
        scale_factor = max(300/height, 300/width)
        new_width = int(width * scale_factor)
        new_height = int(height * scale_factor)
        cleaned = cv2.resize(cleaned, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
    
    return cleaned


def extract_product_patterns(text: str) -> List[Dict]:
    """Extract agricultural product information from OCR text"""
    
    products = []
    
    # Convert to lowercase for pattern matching
    text_lower = text.lower()
    
    # Product type detection patterns
    product_patterns = {
        "herbicida": ["herbicida", "glifosato", "roundup", "2,4-d", "dicamba"],
        "fungicida": ["fungicida", "mancozeb", "cobre", "copper", "azufre"],
        "insecticida": ["insecticida", "imidacloprid", "clorpirifos", "lambda"],
        "fertilizante": ["fertilizante", "abono", "urea", "npk", "nitrato"],
        "acaricida": ["acaricida", "mitici", "acarac"],
        "otros": ["regulador", "humectante", "adherente", "acidul"]
    }
    
    # Extract registration number
    registro_pattern = r'r\.?\s*s\.?\s*[a-z]*\s*(\d+[/-]?\d*)'
    registro_match = re.search(registro_pattern, text_lower)
    
    # Extract dosage
    dosis_pattern = r'(\d+[\.,]?\d*)\s*(ml|l|g|kg|cc)(?:/ha|/100l)?'
    dosis_matches = re.findall(dosis_pattern, text_lower)
    
    # Extract concentration
    concentracion_pattern = r'(\d+[\.,]?\d*)\s*%'
    concentracion_matches = re.findall(concentracion_pattern, text_lower)
    
    # Extract safety period
    plazo_pattern = r'(\d+)\s*d[íi]as?'
    plazo_matches = re.findall(plazo_pattern, text_lower)
    
    # Extract NPK values
    npk_pattern = r'(\d{1,2})[-:](\d{1,2})[-:](\d{1,2})'
    npk_match = re.search(npk_pattern, text)
    
    # Determine product type
    product_type = "otros"
    detected_products = []
    
    for tipo, keywords in product_patterns.items():
        for keyword in keywords:
            if keyword in text_lower:
                product_type = tipo
                detected_products.append(keyword)
                break
        if product_type != "otros":
            break
    
    # Create product info
    product_info = {
        "tipo": product_type,
        "productos_detectados": detected_products,
        "registro_sanitario": registro_match.group(1) if registro_match else None,
        "dosis": [{"cantidad": float(d[0].replace(',', '.')), "unidad": d[1]} for d in dosis_matches],
        "concentracion": [float(c.replace(',', '.')) for c in concentracion_matches],
        "plazo_seguridad_dias": [int(p) for p in plazo_matches],
        "npk": {
            "n": int(npk_match.group(1)),
            "p": int(npk_match.group(2)),
            "k": int(npk_match.group(3))
        } if npk_match else None
    }
    
    if any([product_info["productos_detectados"], product_info["registro_sanitario"], 
            product_info["dosis"], product_info["concentracion"]]):
        products.append(product_info)
    
    return products


def calculate_confidence(text: str, products: List[Dict]) -> float:
    """Calculate confidence score for OCR results"""
    
    confidence = 0.0
    
    # Base confidence from text length and cleanliness
    if len(text.strip()) > 10:
        confidence += 0.3
    
    # Confidence from detected patterns
    if products:
        confidence += 0.4
        
        for product in products:
            if product.get("registro_sanitario"):
                confidence += 0.1
            if product.get("dosis"):
                confidence += 0.1
            if product.get("concentracion"):
                confidence += 0.1
    
    # Text quality indicators
    if re.search(r'\d+', text):  # Contains numbers
        confidence += 0.1
    
    if len(re.findall(r'[A-Za-z]+', text)) > 3:  # Contains words
        confidence += 0.1
    
    return min(confidence, 1.0)