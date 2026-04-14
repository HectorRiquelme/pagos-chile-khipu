"""Schemas Pydantic para request/response."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ProductoOut(BaseModel):
    id: int
    nombre: str
    descripcion: str
    precio_clp: int
    imagen: str

    class Config:
        from_attributes = True


class ItemCobroIn(BaseModel):
    producto_id: int
    cantidad: int = Field(ge=1)


class CobroCreate(BaseModel):
    email_pagador: str = ""
    items: List[ItemCobroIn]


class ItemCobroOut(BaseModel):
    id: int
    producto_id: int
    nombre_producto: str
    precio_unitario_clp: int
    cantidad: int

    class Config:
        from_attributes = True


class CobroOut(BaseModel):
    id: int
    codigo: str
    email_pagador: str
    monto_clp: int
    estado: str
    banco_seleccionado: Optional[str] = None
    creado_en: datetime
    expira_en: datetime
    pagado_en: Optional[datetime] = None
    items: List[ItemCobroOut] = []

    class Config:
        from_attributes = True


class ConfirmarCobroIn(BaseModel):
    banco: str


class WebhookKhipuIn(BaseModel):
    cobro_id: int
    estado: str  # "pagado" o "expirado"
    banco: Optional[str] = None
