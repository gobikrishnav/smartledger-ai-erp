"""
SmartLedger AI ERP — Inventory Velocity & DIR Forecaster Pipeline
Calculates Days of Inventory Remaining (DIR), Sales Velocity, Stock Health Classification,
and Automated Replenishment Recommendations.
"""
import numpy as np
from typing import List, Dict, Any, Optional

class InventoryVelocityPipeline:
    def __init__(self):
        pass

    def evaluate_product(
        self,
        product_name: str,
        current_stock: int,
        reorder_point: int,
        unit_cost: float,
        unit_price: float,
        sales_history_30d: List[int],
        supplier_lead_time_days: int = 7
    ) -> Dict[str, Any]:
        """
        Calculates inventory metrics for an individual SKU.
        """
        sales_arr = np.array(sales_history_30d, dtype=np.float32) if sales_history_30d else np.array([1.0] * 30)
        total_30d_sales = float(np.sum(sales_arr))
        daily_velocity = round(float(total_30d_sales / 30.0), 2)
        
        # Avoid division by zero
        safe_velocity = max(daily_velocity, 0.05)
        dir_days = round(float(current_stock / safe_velocity), 1)

        # Classification
        if total_30d_sales == 0 or dir_days > 180:
            classification = "DEAD_STOCK"
            status_color = "red"
            health_desc = "Capital locked with zero/negligible inventory movement. Recommend clearance discount."
        elif dir_days > 90:
            classification = "SLOW_MOVING"
            status_color = "amber"
            health_desc = "Excess inventory buffer. Reduce purchase order batch size to liberate working capital."
        elif dir_days < 15:
            classification = "CRITICAL_STOCKOUT_RISK"
            status_color = "rose"
            health_desc = "Stock depleted below lead time threshold. Imminent stockout risk."
        elif dir_days <= 45:
            classification = "FAST_MOVING"
            status_color = "emerald"
            health_desc = "High turnover velocity with optimal capital recycling."
        else:
            classification = "OPTIMAL"
            status_color = "blue"
            health_desc = "Balanced inventory within safe operational parameters."

        # Reorder Recommendation
        lead_time_demand = daily_velocity * supplier_lead_time_days
        safety_stock = reorder_point
        recommended_reorder = current_stock <= (lead_time_demand + safety_stock)
        recommended_order_qty = 0
        if recommended_reorder:
            # Economic order quantity heuristic: 30 days of demand + safety stock - current stock
            recommended_order_qty = max(int(np.ceil((daily_velocity * 30) + safety_stock - current_stock)), reorder_point)

        stockout_probability = round(min(1.0, max(0.0, 1.0 - (dir_days / (supplier_lead_time_days * 2.0)))), 2)

        return {
            "product_name": product_name,
            "current_stock": current_stock,
            "daily_velocity_units": daily_velocity,
            "monthly_velocity_units": round(total_30d_sales, 1),
            "days_inventory_remaining": dir_days,
            "classification": classification,
            "status_color": status_color,
            "health_explanation": health_desc,
            "supplier_lead_time_days": supplier_lead_time_days,
            "stockout_probability": stockout_probability,
            "reorder_recommended": recommended_reorder,
            "recommended_order_qty": recommended_order_qty,
            "capital_tied_up": round(current_stock * unit_cost, 2),
            "turnover_ratio": round(float((total_30d_sales * 12) / max(current_stock, 1)), 2)
        }

    def evaluate_batch(self, products: List[Dict[str, Any]]) -> Dict[str, Any]:
        results = []
        dead_stock_capital = 0.0
        fast_moving_count = 0
        critical_count = 0

        for p in products:
            res = self.evaluate_product(
                product_name=p.get("product_name", "Unknown SKU"),
                current_stock=p.get("stock_quantity", 0),
                reorder_point=p.get("reorder_level", 10),
                unit_cost=p.get("cost_price", p.get("unit_price", 100) * 0.65),
                unit_price=p.get("unit_price", 100),
                sales_history_30d=p.get("sales_history_30d", []),
                supplier_lead_time_days=p.get("lead_time_days", 7)
            )
            results.append(res)
            if res["classification"] == "DEAD_STOCK":
                dead_stock_capital += res["capital_tied_up"]
            elif res["classification"] == "FAST_MOVING":
                fast_moving_count += 1
            elif res["classification"] == "CRITICAL_STOCKOUT_RISK":
                critical_count += 1

        return {
            "status": "success",
            "evaluated_products_count": len(results),
            "critical_stockouts_count": critical_count,
            "fast_moving_count": fast_moving_count,
            "dead_stock_capital_locked": round(dead_stock_capital, 2),
            "items": results
        }

inventory_velocity_pipeline = InventoryVelocityPipeline()
