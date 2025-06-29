#!/usr/bin/env python3
"""
Test script for OCR functionality with Gemini Vision
"""

import asyncio
import os
from services.document_processor import DocumentProcessor
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def test_ocr():
    """Test OCR functionality with a sample image"""
    
    print("🔍 Testing OCR with Gemini Vision...")
    
    # Initialize document processor with Gemini model
    model = genai.GenerativeModel('gemini-2.0-flash')
    processor = DocumentProcessor(gemini_model=model)
    
    # Test with a sample image (if exists)
    test_image_path = "uploads/test_image.png"
    
    if os.path.exists(test_image_path):
        print(f"📸 Testing with image: {test_image_path}")
        try:
            content = await processor.process_document(test_image_path)
            print(f"✅ OCR Result: {content[:200]}...")
        except Exception as e:
            print(f"❌ OCR Error: {e}")
    else:
        print("⚠️ No test image found. Please upload an image to test OCR.")
        print("💡 You can test OCR by uploading an image through the web interface.")
    
    # Test vision model initialization
    print("\n🔧 Testing vision model initialization...")
    if processor.vision_model:
        print(f"✅ Vision model: {processor.vision_model.model_name}")
    else:
        print("⚠️ No vision model available, will use regular Gemini model")
    
    print("\n🎯 OCR test completed!")

if __name__ == "__main__":
    asyncio.run(test_ocr()) 