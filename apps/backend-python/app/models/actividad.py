"""
Actividad model - Equivalent to Node.js Actividad model
"""

from sqlalchemy import Column, String, Float, DateTime, Enum, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
import uuid
import enum
from datetime import datetime

from app.database.connection import Base


class TipoActividad(str, enum.Enum):
    """Tipos de actividad agrícola"""
    SIEMBRA = "SIEMBRA"
    FERTILIZACION = "FERTILIZACION"
    TRATAMIENTO = "TRATAMIENTO"
    RIEGO = "RIEGO"
    PODA = "PODA"
    COSECHA = "COSECHA"
    LABOREO = "LABOREO"
    ABONADO = "ABONADO"
    OTROS = "OTROS"


class EstadoActividad(str, enum.Enum):
    """Estados de la actividad"""
    PLANIFICADA = "PLANIFICADA"
    EN_CURSO = "EN_CURSO"
    COMPLETADA = "COMPLETADA"
    CANCELADA = "CANCELADA"


class Actividad(Base):
    """Modelo de actividad agrícola"""
    __tablename__ = "actividades"
    
    # Primary fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tipo = Column(Enum(TipoActividad), nullable=False)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=True)
    
    # Relationship with parcela
    parcela_id = Column(UUID(as_uuid=True), ForeignKey('parcelas.id'), nullable=False)
    
    # User and organization
    usuario_id = Column(String(255), nullable=False)  # Clerk user ID
    organizacion_id = Column(String(255), nullable=True)
    
    # Timing
    fecha = Column(DateTime(timezone=True), nullable=False)
    duracion_horas = Column(Float, nullable=True)
    estado = Column(Enum(EstadoActividad), default=EstadoActividad.PLANIFICADA)
    
    # Location data
    coordenadas = Column(Geometry('POINT', srid=4326), nullable=True)
    superficie_afectada = Column(Float, nullable=True)  # hectáreas
    
    # Products and materials
    productos = Column(JSON, nullable=True)  # Lista de productos utilizados
    maquinaria = Column(JSON, nullable=True)  # Maquinaria utilizada
    
    # Economic data
    costo_mano_obra = Column(Float, nullable=True)
    costo_productos = Column(Float, nullable=True)
    costo_maquinaria = Column(Float, nullable=True)
    costo_total = Column(Float, nullable=True)
    
    # Weather conditions
    condiciones_meteorologicas = Column(JSON, nullable=True)
    
    # OCR and documents
    documentos_ocr = Column(JSON, nullable=True)  # Resultados OCR de productos
    imagenes = Column(JSON, nullable=True)  # URLs de imágenes
    
    # Additional data
    notas = Column(Text, nullable=True)
    configuracion = Column(JSON, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    def __repr__(self):
        return f"<Actividad(id={self.id}, tipo='{self.tipo}', nombre='{self.nombre}')>"
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": str(self.id),
            "tipo": self.tipo.value if self.tipo else None,
            "nombre": self.nombre,
            "descripcion": self.descripcion,
            "parcela_id": str(self.parcela_id),
            "usuario_id": self.usuario_id,
            "organizacion_id": self.organizacion_id,
            "fecha": self.fecha.isoformat() if self.fecha else None,
            "duracion_horas": self.duracion_horas,
            "estado": self.estado.value if self.estado else None,
            "coordenadas": self.coordenadas,
            "superficie_afectada": self.superficie_afectada,
            "productos": self.productos,
            "maquinaria": self.maquinaria,
            "costo_mano_obra": self.costo_mano_obra,
            "costo_productos": self.costo_productos,
            "costo_maquinaria": self.costo_maquinaria,
            "costo_total": self.costo_total,
            "condiciones_meteorologicas": self.condiciones_meteorologicas,
            "documentos_ocr": self.documentos_ocr,
            "imagenes": self.imagenes,
            "notas": self.notas,
            "configuracion": self.configuracion,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data: dict):
        """Create instance from dictionary"""
        return cls(
            tipo=TipoActividad(data.get("tipo")) if data.get("tipo") else None,
            nombre=data.get("nombre"),
            descripcion=data.get("descripcion"),
            parcela_id=data.get("parcela_id"),
            usuario_id=data.get("usuario_id"),
            organizacion_id=data.get("organizacion_id"),
            fecha=data.get("fecha"),
            duracion_horas=data.get("duracion_horas"),
            estado=EstadoActividad(data.get("estado")) if data.get("estado") else EstadoActividad.PLANIFICADA,
            superficie_afectada=data.get("superficie_afectada"),
            productos=data.get("productos"),
            maquinaria=data.get("maquinaria"),
            costo_mano_obra=data.get("costo_mano_obra"),
            costo_productos=data.get("costo_productos"),
            costo_maquinaria=data.get("costo_maquinaria"),
            costo_total=data.get("costo_total"),
            condiciones_meteorologicas=data.get("condiciones_meteorologicas"),
            documentos_ocr=data.get("documentos_ocr"),
            imagenes=data.get("imagenes"),
            notas=data.get("notas"),
            configuracion=data.get("configuracion")
        )