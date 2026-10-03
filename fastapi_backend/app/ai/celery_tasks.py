from datetime import datetime
from app.celery_config import celery_app
from app.core.database import SessionLocal
from app.core.config import settings
from app.models.invoice import InvoiceHeader, InvoiceLineItem
from app.models.ai_audit import AIFraudAuditLog
from app.ai.feature_extractor import extract_features
from app.ai.isolation_forest import fraud_detector

@celery_app.task(name='analyze_invoice_fraud', bind=True, max_retries=3)
def analyze_invoice_fraud(self, invoice_id: str):
    db = SessionLocal()
    try:
        invoice = db.query(InvoiceHeader).filter_by(invoice_id=invoice_id).first()
        if not invoice:
            return
        items = db.query(InvoiceLineItem).filter_by(invoice_id=invoice_id).all()
        features = extract_features(invoice, items, db)
        result = fraud_detector.predict(features)

        audit = AIFraudAuditLog(
            invoice_id=invoice_id,
            risk_score=result['risk_score'],
            anomaly_detected=result['anomaly_detected'],
            feature_vector_json=features.tolist(),
            model_version='isolation_forest_v1',
            review_status='PENDING'
        )
        db.add(audit)
        db.commit()

        if result['anomaly_detected']:
            import redis, json
            r = redis.from_url(settings.REDIS_URL)
            alert_payload = {
                'type': 'FRAUD_ALERT',
                'audit_id': str(audit.audit_id),
                'invoice_id': invoice_id,
                'invoice_number': invoice.invoice_number,
                'risk_score': result['risk_score'],
                'flag_level': result['flag_level'],
                'grand_total': float(invoice.grand_total),
                'timestamp': datetime.utcnow().isoformat()
            }
            r.publish('fraud_alerts', json.dumps(alert_payload))
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc, countdown=30)
    finally:
        db.close()
