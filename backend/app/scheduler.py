"""Cron job que expira cobros pendientes con mas de 24 horas."""
import logging

from apscheduler.schedulers.background import BackgroundScheduler

from .crud import expirar_cobros_vencidos
from .database import SessionLocal

logger = logging.getLogger("khipu.scheduler")


def _job_expirar_cobros():
    db = SessionLocal()
    try:
        cantidad = expirar_cobros_vencidos(db)
        if cantidad:
            logger.info("Cobros expirados automaticamente: %s", cantidad)
    except Exception:
        logger.exception("Error ejecutando job de expiracion de cobros")
    finally:
        db.close()


def iniciar_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler(timezone="America/Santiago")
    # Revisa cada 5 minutos. Los cobros expiran a las 24h de su creacion.
    scheduler.add_job(
        _job_expirar_cobros,
        "interval",
        minutes=5,
        id="expirar_cobros",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler iniciado. Job 'expirar_cobros' cada 5 minutos.")
    return scheduler
