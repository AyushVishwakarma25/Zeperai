import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import Response
from rembg import remove, new_session
import io

app = FastAPI(title="ZeperAi Sovereign Background Removal Pro")

# Load the RMBG-2.0 or u2net model for high quality. 
# Ensure the server has decent RAM or GPU.
model_name = os.environ.get("REMBG_MODEL", "bria") # "bria" requires u2net/RMBG-2.0 setup in rembg
session = new_session(model_name)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "ZeperAi PRO BG Engine Running", "model": model_name}

@app.post("/remove")
async def remove_background_endpoint(image_file: UploadFile = File(None), image_file_b64: str = None):
    # This endpoint mimics the form-data structure you'd expect or simple file upload.
    # We can handle both file upload and Base64 depending on what you send.
    
    try:
        input_data = None
        if image_file:
            input_data = await image_file.read()
        elif image_file_b64:
            import base64
            input_data = base64.b64decode(image_file_b64)
        else:
            raise HTTPException(status_code=400, detail="No image provided")

        # Process image using rembg
        output_data = remove(input_data, session=session)
        
        return Response(content=output_data, media_type="image/png")
    
    except Exception as e:
        print(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove background")

import pandas as pd
from typing import List

@app.post("/analyze-shopify")
async def analyze_shopify(files: List[UploadFile] = File(...)):
    dfs = {}
    for file in files:
        if not file.filename.endswith('.csv'):
            continue
        try:
            content = await file.read()
            df = pd.read_csv(io.BytesIO(content))
            dfs[file.filename.lower()] = df
        except Exception as e:
            print(f"Error reading {file.filename}: {e}")
            continue

    # Identify tables
    products_df = next((df for k, df in dfs.items() if 'product' in k), pd.DataFrame())
    orders_df = next((df for k, df in dfs.items() if 'order' in k), pd.DataFrame())
    analytics_df = next((df for k, df in dfs.items() if 'analytic' in k or 'sales' in k), pd.DataFrame())

    if products_df.empty and orders_df.empty and analytics_df.empty:
        # Fallback if only one generic file uploaded
        if len(dfs) == 1:
            analytics_df = list(dfs.values())[0]
        else:
            raise HTTPException(status_code=400, detail="No recognizable Shopify CSVs found (Products, Orders, Analytics).")

    # Clean and standardize columns to lower case
    for df in [products_df, orders_df, analytics_df]:
        if not df.empty:
            df.columns = [c.lower() for c in df.columns]

    merged_df = pd.DataFrame()
    join_key = None

    # Global Merge Logic based on SKU or Handle
    if not products_df.empty and not analytics_df.empty:
        if 'sku' in products_df.columns and 'sku' in analytics_df.columns:
            join_key = 'sku'
        elif 'handle' in products_df.columns and 'handle' in analytics_df.columns:
            join_key = 'handle'

    if join_key:
        merged_df = pd.concat([products_df.set_index(join_key), analytics_df.set_index(join_key)], axis=1, join='outer').reset_index()
    else:
        # If no join possible, just use analytics as main
        merged_df = analytics_df if not analytics_df.empty else products_df
    
    if merged_df.empty:
         raise HTTPException(status_code=400, detail="Data could not be merged or is empty.")

    # Convert numeric columns
    for col in merged_df.columns:
        if 'sales' in col or 'revenue' in col or 'price' in col or 'margin' in col or 'spend' in col:
            merged_df[col] = pd.to_numeric(merged_df[col].astype(str).str.replace(r'[$,]', '', regex=True), errors='coerce').fillna(0)
        elif 'order' in col or 'click' in col or 'quantity' in col or 'age' in col:
            merged_df[col] = pd.to_numeric(merged_df[col], errors='coerce').fillna(0)
        elif 'rate' in col:
            merged_df[col] = pd.to_numeric(merged_df[col].astype(str).str.replace('%', '', regex=False), errors='coerce').fillna(0) / 100

    # Ensure required metrics columns exist by filling missing ones with defaults or deriving them
    if 'total orders' not in merged_df.columns and 'orders' in merged_df.columns:
        merged_df['total orders'] = merged_df['orders']
    if 'total clicks' not in merged_df.columns and 'clicks' in merged_df.columns:
        merged_df['total clicks'] = merged_df['clicks']
    if 'total orders' not in merged_df.columns: merged_df['total orders'] = merged_df.get('net quantity', 1)
    if 'total clicks' not in merged_df.columns: merged_df['total clicks'] = 100
    if 'margin' not in merged_df.columns: merged_df['margin'] = 0.5
    if 'conversion_rate' not in merged_df.columns: merged_df['conversion_rate'] = merged_df['total orders'] / merged_df['total clicks']
    if 'inventory_age' not in merged_df.columns: merged_df['inventory_age'] = 30
    if 'spend' not in merged_df.columns: merged_df['spend'] = 0
    if 'atc' not in merged_df.columns: merged_df['atc'] = merged_df['total orders'] * 2
    if 'title' not in merged_df.columns:
        merged_df['title'] = merged_df.get('product title', merged_df.get('name', merged_df.get(join_key, 'Unknown Product')))

    # Handle division by zero
    merged_df['total clicks'] = merged_df['total clicks'].replace(0, 1)
    merged_df['inventory_age'] = merged_df['inventory_age'].replace(0, 1)
    merged_df['atc'] = merged_df['atc'].replace(0, 1)

    # Calculate metrics
    # Conversion Velocity: Total Orders / Total Clicks
    merged_df['conversion_velocity'] = (merged_df['total orders'] / merged_df['total clicks']).fillna(0)

    # Ad-Push Score: (Margin * Conversion_Rate) / Inventory_Age
    merged_df['ad_push_score'] = ((merged_df['margin'] * merged_df['conversion_rate']) / merged_df['inventory_age']).fillna(0)

    # 'Burn' Detector: High 'Spend' but low 'ATC'
    merged_df['burn_ratio'] = (merged_df['spend'] / merged_df['atc']).fillna(0)

    # Output JSON summary identify Top 5 'Push' and Top 3 'Stop'
    push_df = merged_df.sort_values(by='ad_push_score', ascending=False)
    # Ensure title is string
    push_df['title'] = push_df['title'].astype(str)

    top_push = push_df.head(5).to_dict(orient='records')
    top_stop = push_df.sort_values(by='burn_ratio', ascending=False).head(3).to_dict(orient='records')

    push_results = []
    for row in top_push:
        push_results.append({
            "name": row['title'] if pd.notna(row['title']) and str(row['title']) != 'nan' else 'Unknown Product',
            "score": round(row['ad_push_score'], 4),
            "reasoning": f"Product shows high conversion velocity ({round(row['conversion_velocity']*100, 2)}%) and healthy margin. Ready to scale."
        })

    stop_results = []
    for row in top_stop:
        stop_results.append({
            "name": row['title'] if pd.notna(row['title']) and str(row['title']) != 'nan' else 'Unknown Product',
            "score": round(row['burn_ratio'], 2),
            "reasoning": f"High burn detected. High ad spend with low add-to-cart ratio ({round(row['burn_ratio'], 2)}). Stop or optimize ads."
        })

    # Prepare chart data (Sales Trend mockup if date exists, otherwise we just take top products series)
    chart_data = {"dates": [], "revenue": []}
    if 'date' in merged_df.columns:
         trend = merged_df.groupby('date')['total sales'].sum().reset_index()
         chart_data = {"dates": trend['date'].tolist(), "revenue": trend['total sales'].tolist()}
    
    return {
        "top_push_products": push_results,
        "top_stop_products": stop_results,
        "chart_data": chart_data
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
