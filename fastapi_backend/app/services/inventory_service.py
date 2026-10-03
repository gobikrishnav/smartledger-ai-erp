from sqlalchemy.orm import Session
from app.models.inventory import InventoryStorage
from app.models.product import ProductCatalog
from fastapi import HTTPException

class InventoryService:
    def __init__(self, db: Session):
        self.db = db

    def get_stock_alerts(self, branch_id: str):
        return self.db.query(ProductCatalog.product_name, ProductCatalog.sku_code, InventoryStorage.stock_quantity, ProductCatalog.reorder_level)\
            .join(InventoryStorage, ProductCatalog.product_id == InventoryStorage.product_id)\
            .filter(InventoryStorage.branch_id == branch_id, InventoryStorage.stock_quantity <= ProductCatalog.reorder_level).all()

    def get_all_products(self, branch_id: str):
        return self.db.query(ProductCatalog, InventoryStorage)\
            .outerjoin(InventoryStorage, ProductCatalog.product_id == InventoryStorage.product_id)\
            .filter(InventoryStorage.branch_id == branch_id).all()

    def process_grn(self, data: dict):
        inventory = self.db.query(InventoryStorage).filter_by(
            product_id=data['product_id'], branch_id=data['branch_id'], batch_number=data.get('batch_number')
        ).first()
        if inventory:
            inventory.stock_quantity += data['quantity']
        else:
            inventory = InventoryStorage(**data)
            self.db.add(inventory)
        self.db.commit()
        return {"status": "success", "stock_quantity": inventory.stock_quantity}
        
    def create_product(self, data: dict, warehouse_manager_id: str):
        product = ProductCatalog(
            sku_code=data['sku_code'],
            product_name=data['product_name'],
            category_id=data['category_id'],
            base_price=data['base_price'],
            cost_price=data['cost_price'],
            tax_rate_pct=data['tax_rate_pct'],
            warehouse_manager_id=warehouse_manager_id
        )
        self.db.add(product)
        self.db.commit()
        return product
