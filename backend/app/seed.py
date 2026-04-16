from backend.app.db import SessionLocal
from backend.app.models import Order, Metric, Trend

def load_seed_data():
    db = SessionLocal()
    try:
        # Seed Orders
        if db.query(Order).count() == 0:
            orders = [
                Order(customer_name="Alice", item="Widget", quantity=5),
                Order(customer_name="Bob", item="Gadget", quantity=2),
                Order(customer_name="Charlie", item="Thingamajig", quantity=7),
            ]
            db.add_all(orders)
        
        # Seed Metrics
        if db.query(Metric).count() == 0:
            metrics = [
                Metric(name="Total Sales", value=1000),
                Metric(name="Active Users", value=150),
                Metric(name="Conversion Rate", value=2.5),
            ]
            db.add_all(metrics)
        
        # Seed Trends
        if db.query(Trend).count() == 0:
            trends = [
                Trend(date="2024-06-01", value=100),
                Trend(date="2024-06-02", value=120),
                Trend(date="2024-06-03", value=140),
            ]
            db.add_all(trends)
        
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    load_seed_data()
