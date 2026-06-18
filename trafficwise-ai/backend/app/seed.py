import os
import csv
from datetime import datetime
from sqlalchemy import text
from app.database import engine, SessionLocal, Base
from app.models import TrafficEvent


def parse_datetime(val):
    if not val or val in ("NULL", "null", ""):
        return None
    try:
        return datetime.fromisoformat(val.replace("+00", "+00:00").replace("Z", "+00:00"))
    except Exception:
        try:
            return datetime.strptime(val[:19], "%Y-%m-%d %H:%M:%S")
        except Exception:
            return None


def parse_bool(val):
    if isinstance(val, bool):
        return val
    return str(val).upper() in ("TRUE", "1", "YES")


def seed_database():
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        conn.commit()

    db = SessionLocal()
    try:
        count = db.query(TrafficEvent).count()
        if count > 0:
            print(f"Database already seeded with {count} events")
            return count

        csv_path = os.getenv(
            "CSV_PATH",
            os.path.join(
                os.path.dirname(__file__),
                "../../Astram event data_anonymized - Astram event data_anonymizedb40ac87.csv",
            ),
        )
        if not os.path.exists(csv_path):
            alt = os.path.join(
                os.path.dirname(__file__),
                "../../../Astram event data_anonymized - Astram event data_anonymizedb40ac87.csv",
            )
            csv_path = alt if os.path.exists(alt) else csv_path

        if not os.path.exists(csv_path):
            print(f"CSV not found at {csv_path}")
            return 0

        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            batch = []
            for row in reader:
                lat = float(row["latitude"]) if row.get("latitude") else 0.0
                lng = float(row["longitude"]) if row.get("longitude") else 0.0
                if lat == 0 and lng == 0:
                    continue

                event = TrafficEvent(
                    id=row["id"],
                    event_type=row.get("event_type") or "unplanned",
                    event_cause=row.get("event_cause") or "others",
                    latitude=lat,
                    longitude=lng,
                    start_datetime=parse_datetime(row.get("start_datetime")),
                    end_datetime=parse_datetime(row.get("end_datetime")),
                    status=row.get("status") or "closed",
                    priority=row.get("priority") or "Low",
                    corridor=row.get("corridor") if row.get("corridor") not in ("NULL", "", None) else None,
                    police_station=row.get("police_station") if row.get("police_station") not in ("NULL", "", None) else None,
                    zone=row.get("zone") if row.get("zone") not in ("NULL", "", None) else None,
                    junction=row.get("junction") if row.get("junction") not in ("NULL", "", None) else None,
                    requires_road_closure=parse_bool(row.get("requires_road_closure", "FALSE")),
                    description=row.get("description") if row.get("description") not in ("NULL", "", None) else None,
                    address=row.get("address") if row.get("address") not in ("NULL", "", None) else None,
                )
                batch.append(event)

                if len(batch) >= 500:
                    db.bulk_save_objects(batch)
                    db.commit()
                    batch = []

            if batch:
                db.bulk_save_objects(batch)
                db.commit()

        with engine.connect() as conn:
            conn.execute(
                text(
                    """
                    UPDATE traffic_events
                    SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
                    WHERE location IS NULL AND latitude != 0 AND longitude != 0
                    """
                )
            )
            conn.commit()

        total = db.query(TrafficEvent).count()
        print(f"Seeded {total} traffic events")
        return total
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
