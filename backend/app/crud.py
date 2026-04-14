"""Operaciones CRUD sobre productos y cobros."""
import secrets
from datetime import datetime
from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from . import models, schemas


def listar_productos(db: Session) -> List[models.Producto]:
    return db.query(models.Producto).order_by(models.Producto.id).all()


def obtener_producto(db: Session, producto_id: int) -> Optional[models.Producto]:
    return db.query(models.Producto).filter(models.Producto.id == producto_id).first()


def crear_cobro(db: Session, data: schemas.CobroCreate) -> models.Cobro:
    monto_total = 0
    items_modelo: List[models.ItemCobro] = []

    for item in data.items:
        producto = obtener_producto(db, item.producto_id)
        if not producto:
            raise ValueError(f"Producto {item.producto_id} no existe")
        subtotal = producto.precio_clp * item.cantidad
        monto_total += subtotal
        items_modelo.append(
            models.ItemCobro(
                producto_id=producto.id,
                nombre_producto=producto.nombre,
                precio_unitario_clp=producto.precio_clp,
                cantidad=item.cantidad,
            )
        )

    codigo = f"KHP-{secrets.token_hex(6).upper()}"
    cobro = models.Cobro(
        codigo=codigo,
        email_pagador=data.email_pagador or "",
        monto_clp=monto_total,
        estado="pendiente",
        items=items_modelo,
    )
    db.add(cobro)
    db.commit()
    db.refresh(cobro)
    return cobro


def obtener_cobro(db: Session, cobro_id: int) -> Optional[models.Cobro]:
    return db.query(models.Cobro).filter(models.Cobro.id == cobro_id).first()


def marcar_cobro_pagado(
    db: Session, cobro_id: int, banco: Optional[str] = None
) -> Optional[models.Cobro]:
    cobro = obtener_cobro(db, cobro_id)
    if not cobro:
        return None
    if cobro.estado != "pendiente":
        return cobro
    cobro.estado = "pagado"
    cobro.pagado_en = datetime.utcnow()
    if banco:
        cobro.banco_seleccionado = banco
    db.commit()
    db.refresh(cobro)
    return cobro


def marcar_cobro_expirado(db: Session, cobro_id: int) -> Optional[models.Cobro]:
    cobro = obtener_cobro(db, cobro_id)
    if not cobro:
        return None
    if cobro.estado != "pendiente":
        return cobro
    cobro.estado = "expirado"
    db.commit()
    db.refresh(cobro)
    return cobro


def expirar_cobros_vencidos(db: Session) -> int:
    """Marca como 'expirado' todos los cobros pendientes cuya fecha de
    expiracion ya paso. Retorna la cantidad de cobros expirados."""
    ahora = datetime.utcnow()
    vencidos = (
        db.query(models.Cobro)
        .filter(
            and_(
                models.Cobro.estado == "pendiente",
                models.Cobro.expira_en <= ahora,
            )
        )
        .all()
    )
    for c in vencidos:
        c.estado = "expirado"
    if vencidos:
        db.commit()
    return len(vencidos)


def listar_cobros_admin(
    db: Session,
    estado: Optional[str] = None,
    desde: Optional[datetime] = None,
    hasta: Optional[datetime] = None,
) -> List[models.Cobro]:
    q = db.query(models.Cobro)
    if estado:
        q = q.filter(models.Cobro.estado == estado)
    if desde:
        q = q.filter(models.Cobro.creado_en >= desde)
    if hasta:
        q = q.filter(models.Cobro.creado_en <= hasta)
    return q.order_by(models.Cobro.creado_en.desc()).all()
