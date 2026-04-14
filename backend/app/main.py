"""Aplicacion FastAPI - Khipu Pagos Mock."""
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import Base, SessionLocal, engine, get_db
from .scheduler import iniciar_scheduler
from .seed import PRODUCTOS_DEMO

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("khipu.main")


def _cargar_productos_si_vacio():
    """Si la tabla de productos esta vacia, cargar los productos demo.
    Asi el frontend nunca se queda sin catalogo."""
    db = SessionLocal()
    try:
        if db.query(models.Producto).count() == 0:
            for p in PRODUCTOS_DEMO:
                db.add(models.Producto(**p))
            db.commit()
            logger.info("Productos demo cargados automaticamente.")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _cargar_productos_si_vacio()
    scheduler = iniciar_scheduler()
    try:
        yield
    finally:
        scheduler.shutdown(wait=False)


app = FastAPI(
    title="Khipu Pagos Mock",
    description="Simulacion del flujo de pagos por transferencia bancaria (Khipu)",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------- PRODUCTOS ----------------------

@app.get("/api/productos", response_model=List[schemas.ProductoOut])
def listar_productos(db: Session = Depends(get_db)):
    return crud.listar_productos(db)


# ---------------------- COBROS ----------------------

@app.post("/api/cobros", response_model=schemas.CobroOut, status_code=201)
def crear_cobro(payload: schemas.CobroCreate, db: Session = Depends(get_db)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="El cobro debe tener al menos un item")
    try:
        cobro = crud.crear_cobro(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return cobro


@app.get("/api/cobros/{cobro_id}", response_model=schemas.CobroOut)
def obtener_cobro(cobro_id: int, db: Session = Depends(get_db)):
    cobro = crud.obtener_cobro(db, cobro_id)
    if not cobro:
        raise HTTPException(status_code=404, detail="Cobro no encontrado")
    return cobro


@app.post("/api/cobros/{cobro_id}/confirmar", response_model=schemas.CobroOut)
def confirmar_cobro(
    cobro_id: int,
    payload: schemas.ConfirmarCobroIn,
    db: Session = Depends(get_db),
):
    """Simula la confirmacion del usuario en la pagina del banco.
    Internamente dispara el mismo flujo que el webhook de Khipu."""
    cobro = crud.obtener_cobro(db, cobro_id)
    if not cobro:
        raise HTTPException(status_code=404, detail="Cobro no encontrado")
    if cobro.estado == "expirado":
        raise HTTPException(status_code=400, detail="El cobro esta expirado")
    if cobro.estado == "pagado":
        return cobro
    cobro = crud.marcar_cobro_pagado(db, cobro_id, banco=payload.banco)
    return cobro


# ---------------------- WEBHOOK ----------------------

@app.post("/api/webhook/khipu", response_model=schemas.CobroOut)
def webhook_khipu(payload: schemas.WebhookKhipuIn, db: Session = Depends(get_db)):
    """Webhook simulado de Khipu. En produccion vendria firmado desde Khipu,
    aqui es llamado desde el propio frontend para completar el flujo mock."""
    cobro = crud.obtener_cobro(db, payload.cobro_id)
    if not cobro:
        raise HTTPException(status_code=404, detail="Cobro no encontrado")

    if payload.estado == "pagado":
        if cobro.estado == "expirado":
            raise HTTPException(status_code=400, detail="Cobro expirado, no puede pagarse")
        cobro = crud.marcar_cobro_pagado(db, payload.cobro_id, banco=payload.banco)
    elif payload.estado == "expirado":
        cobro = crud.marcar_cobro_expirado(db, payload.cobro_id)
    else:
        raise HTTPException(status_code=400, detail="Estado invalido")

    logger.info("Webhook Khipu recibido: cobro=%s estado=%s", cobro.id, cobro.estado)
    return cobro


# ---------------------- ADMIN ----------------------

@app.get("/api/admin/cobros", response_model=List[schemas.CobroOut])
def admin_listar_cobros(
    estado: Optional[str] = Query(None, pattern="^(pendiente|pagado|expirado)$"),
    desde: Optional[datetime] = None,
    hasta: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    return crud.listar_cobros_admin(db, estado=estado, desde=desde, hasta=hasta)


@app.get("/api/admin/resumen")
def admin_resumen(db: Session = Depends(get_db)):
    cobros = db.query(models.Cobro).all()
    total = len(cobros)
    pagados = sum(1 for c in cobros if c.estado == "pagado")
    pendientes = sum(1 for c in cobros if c.estado == "pendiente")
    expirados = sum(1 for c in cobros if c.estado == "expirado")
    monto_pagado = sum(c.monto_clp for c in cobros if c.estado == "pagado")
    return {
        "total": total,
        "pagados": pagados,
        "pendientes": pendientes,
        "expirados": expirados,
        "monto_total_pagado_clp": monto_pagado,
    }


@app.get("/")
def root():
    return {"servicio": "Khipu Pagos Mock", "version": "1.0.0", "docs": "/docs"}
