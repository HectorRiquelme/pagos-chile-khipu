"""Carga inicial de productos de ejemplo."""
from .database import Base, SessionLocal, engine
from .models import Producto


PRODUCTOS_DEMO = [
    {
        "nombre": "Polera Selección Chilena",
        "descripcion": "Polera oficial de la Roja, talla M, temporada 2026.",
        "precio_clp": 34990,
        "imagen": "https://via.placeholder.com/300x300?text=Polera+La+Roja",
    },
    {
        "nombre": "Mate Matero Artesanal",
        "descripcion": "Mate de madera de raulí con bombilla de acero.",
        "precio_clp": 15990,
        "imagen": "https://via.placeholder.com/300x300?text=Mate",
    },
    {
        "nombre": "Caja 6 Vinos Carmenere",
        "descripcion": "Caja con 6 botellas de Carmenere Valle del Maipo.",
        "precio_clp": 49990,
        "imagen": "https://via.placeholder.com/300x300?text=Vinos+Carmenere",
    },
    {
        "nombre": "Manta Chilota de Lana",
        "descripcion": "Manta tejida a mano en Chiloé, 100% lana natural.",
        "precio_clp": 28990,
        "imagen": "https://via.placeholder.com/300x300?text=Manta+Chilota",
    },
    {
        "nombre": "Set Sopaipillas Congeladas (12u)",
        "descripcion": "Pack de 12 sopaipillas listas para freír.",
        "precio_clp": 4990,
        "imagen": "https://via.placeholder.com/300x300?text=Sopaipillas",
    },
    {
        "nombre": "Libro Neruda - Antología",
        "descripcion": "Antología poética de Pablo Neruda, tapa dura.",
        "precio_clp": 12990,
        "imagen": "https://via.placeholder.com/300x300?text=Neruda",
    },
]


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Producto).count() > 0:
            print("Ya existen productos. Nada que hacer.")
            return
        for p in PRODUCTOS_DEMO:
            db.add(Producto(**p))
        db.commit()
        print(f"Insertados {len(PRODUCTOS_DEMO)} productos de ejemplo.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
