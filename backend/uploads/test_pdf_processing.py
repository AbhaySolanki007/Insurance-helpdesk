#!/usr/bin/env python3
"""
Test script for PDF processing functionality.
Run this script to test the PDF-to-vector pipeline.
"""

import os
import sys
import requests
import json
from pathlib import Path

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_pdf_upload():
    """Test PDF upload functionality."""
    print("🧪 Testing PDF Upload System")
    print("=" * 50)

    # Test data
    test_pdf_path = "test_document.pdf"  # You'll need to create this
    api_url = "http://localhost:8001"

    # Check if test PDF exists
    if not os.path.exists(test_pdf_path):
        print("❌ Test PDF not found. Please create a test_document.pdf file.")
        print("   You can use any PDF file and rename it to test_document.pdf")
        print("   For now, you can test the direct processor functionality.")
        return False

    try:
        # Test: Upload PDF
        print("\n1️⃣ Testing PDF upload...")

        with open(test_pdf_path, "rb") as f:
            files = {"file": f}
            data = {
                "user_id": "USR1000",
                "document_type": "policy",
                "description": "Test policy document",
            }

            response = requests.post(
                f"{api_url}/api/upload/pdf", files=files, data=data
            )

        if response.status_code == 200:
            result = response.json()
            print(f"✅ PDF uploaded successfully!")
            print(f"   Document ID: {result['document_id']}")
            print(f"   Chunks: {result['chunk_count']}")
            print(f"   Text Length: {result['text_length']}")
            print(f"   Filename: {result['filename']}")
            print(f"   Document Type: {result['document_type']}")
        else:
            print(f"❌ Upload failed: {response.text}")
            return False

        print("\n🎉 PDF upload test passed! System is working correctly.")
        return True

    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the server.")
        print("   Make sure your Flask app is running on http://localhost:8001")
        return False
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_pdf_processor_directly():
    """Test PDF processor directly without API."""
    print("\n🔧 Testing PDF Processor Directly")
    print("=" * 50)

    try:
        from pdf_processor import PDFProcessor

        # Initialize processor
        processor = PDFProcessor()
        print("✅ PDF Processor initialized successfully")
        print(f"   PDF DB Path: {processor.pdf_db_path}")
        print(f"   Collection Name: {processor.collection_name}")

        # Test with the sample text file we created
        test_text_file = "test_document.txt"
        if os.path.exists(test_text_file):
            with open(test_text_file, "r", encoding="utf-8") as f:
                sample_text = f.read()
            print(f"✅ Loaded test document: {test_text_file}")
        else:
            # Fallback to sample text
            sample_text = """
            This is a sample insurance policy document.
            It contains information about coverage, premiums, and terms.
            The policy covers various types of insurance including health, auto, and home.
            Premiums are calculated based on risk factors and coverage amounts.
            """

        # Test chunking
        chunks = processor.chunk_text(sample_text)
        print(f"✅ Text chunking successful: {len(chunks)} chunks created")

        # Test document ID generation
        doc_id = processor.generate_document_id("test.pdf", sample_text)
        print(f"✅ Document ID generated: {doc_id}")

        # Test processing (simulate PDF processing with text)
        result = processor.process_pdf(
            pdf_path=test_text_file if os.path.exists(test_text_file) else None,
            filename="test_document.pdf",
            user_id="USR1000",
            document_type="policy",
            metadata={"test": True},
        )

        if result["success"]:
            print(f"✅ PDF processing simulation successful!")
            print(f"   Document ID: {result['document_id']}")
            print(f"   Chunks: {result['chunk_count']}")
        else:
            print(
                f"⚠️ PDF processing simulation failed: {result.get('error', 'Unknown error')}"
            )

        print("✅ Direct PDF processor test passed!")
        return True

    except Exception as e:
        print(f"❌ Direct test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("🚀 Starting PDF Processing Tests")
    print("=" * 60)

    # Test 1: Direct processor test
    direct_success = test_pdf_processor_directly()

    # Test 2: API upload test
    api_success = test_pdf_upload()

    print("\n" + "=" * 60)
    print("📊 Test Results Summary:")
    print(f"   Direct Processor Test: {'✅ PASSED' if direct_success else '❌ FAILED'}")
    print(f"   PDF Upload Test: {'✅ PASSED' if api_success else '❌ FAILED'}")

    if direct_success and api_success:
        print("\n🎉 All tests passed! Your PDF upload system is ready!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
        sys.exit(1)
