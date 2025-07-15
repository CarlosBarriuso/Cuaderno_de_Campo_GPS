"""
Parcela model - Equivalent to Node.js Parcela model
"""

from sqlalchemy import Column, String, Float, Boolean, DateTime, Enum, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
import uuid
import enum
from datetime import datetime

from app.database.connection import Base


class TipoCultivo(str, enum.Enum):
    """Tipos de cultivo disponibles"""
    CEREAL_SECANO = "CEREAL_SECANO"
    CEREAL_REGADIO = "CEREAL_REGADIO"
    OLIVAR = "OLIVAR"
    VINEDO = "VINEDO"
    FRUTAL = "FRUTAL"
    HORTALIZA_AIRE_LIBRE = "HORTALIZA_AIRE_LIBRE"
    HORTALIZA_INVERNADERO = "HORTALIZA_INVERNADERO"
    LEGUMINOSA = "LEGUMINOSA"
    FORRAJE = "FORRAJE"
    BARBECHO = "BARBECHO"
    OTROS = "OTROS"


class Parcela(Base):
    """Modelo de parcela agrícola"""
    __tablename__ = "parcelas"
    
    # Primary fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(255), nullable=False)
    superficie = Column(Float, nullable=False)  # hectáreas
    
    # Cultivo information
    tipo_cultivo = Column(Enum(TipoCultivo), nullable=False)
    cultivo = Column(String(255), nullable=False)  # Nombre específico del cultivo
    variedad = Column(String(255), nullable=True)  # Variedad específica
    
    # SIGPAC integration
    referencia_sigpac = Column(String(50), nullable=True, unique=True)
    
    # Geospatial data
    geometria = Column(Geometry('POLYGON', srid=4326), nullable=True)
    centroide = Column(Geometry('POINT', srid=4326), nullable=True)
    
    # Ownership and status
    propietario_id = Column(String(255), nullable=False)  # Clerk user ID
    organizacion_id = Column(String(255), nullable=True)  # Organization ID
    activa = Column(Boolean, default=True)
    
    # Additional information
    descripcion = Column(Text, nullable=True)
    configuracion = Column(JSON, nullable=True)  # Configuración específica del cultivo
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    def __repr__(self):
        return f"<Parcela(id={self.id}, nombre='{self.nombre}', superficie={self.superficie})>"
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": str(self.id),
            "nombre": self.nombre,
            "superficie": self.superficie,
            "tipo_cultivo": self.tipo_cultivo.value if self.tipo_cultivo else None,
            "cultivo": self.cultivo,
            "variedad": self.variedad,
            "referencia_sigpac": self.referencia_sigpac,
            "geometria": self.geometria,
            "centroide": self.centroide,
            "propietario_id": self.propietario_id,
            "organizacion_id": self.organizacion_id,
            "activa": self.activa,
            "descripcion": self.descripcion,
            "configuracion": self.configuracion,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data: dict):
        """Create instance from dictionary"""
        return cls(
            nombre=data.get("nombre"),
            superficie=data.get("superficie"),
            tipo_cultivo=TipoCultivo(data.get("tipo_cultivo")) if data.get("tipo_cultivo") else None,
            cultivo=data.get("cultivo"),
            variedad=data.get("variedad"),
            referencia_sigpac=data.get("referencia_sigpac"),
            propietario_id=data.get("propietario_id"),
            organizacion_id=data.get("organizacion_id"),
            activa=data.get("activa", True),
            descripcion=data.get("descripcion"),
            configuracion=data.get("configuracion")
        )