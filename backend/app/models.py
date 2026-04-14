"""Modelos SQLAlchemy: Producto, Cobro, ItemCobro."""
from datetime import datetime, timedelta

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


ESTADOS_COBRO = ("pendiente", "pagado", "expirado")


def _expira_default():
    return datetime.utcnow() + timedelta(hours=24)


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=False, default="")
    precio_clp = Column(Integer, nullable=False)  # en pesos chilenos, enteros
    imagen = Column(String(500), nullable=False, default="")


class Cobro(Base):
    __tablename__ = "cobros"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(40), unique=True, index=True, nullable=False)
    email_pagador = Column(String(200), nullable=False, default="")
    monto_clp = Column(Integer, nullable=False)
    estado = Column(String(20), nullable=False, default="pendiente", index=True)
    banco_seleccionado = Column(String(100), nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    expira_en = Column(DateTime, default=_expira_default, nullable=False)
    pagado_en = Column(DateTime, nullable=True)

    items = relationship(
        "ItemCobro", back_populates="cobro", cascade="all, delete-orphan"
    )


class ItemCobro(Base):
    __tablename__ = "items_cobro"

    id = Column(Integer, primary_key=True, index=True)
    cobro_id = Column(Integer, ForeignKey("cobros.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    nombre_producto = Column(String(200), nullable=False)
    precio_unitario_clp = Column(Integer, nullable=False)
    cantidad = Column(Integer, nullable=False)

    cobro = relationship("Cobro", back_populates="items")
    producto = relationship("Producto")
