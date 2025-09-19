# 📄 PDF Upload & Processing System

This system allows users to upload PDF documents, extract text content, and store them as vectors in ChromaDB. The documents will be integrated with the existing Level 2 agent for intelligent Q&A.

## 🚀 Features

- **PDF Upload**: Upload PDF files through REST API
- **Text Extraction**: Extract text from PDFs using multiple methods
- **Vector Storage**: Store document chunks as vectors in ChromaDB
- **User Management**: Link documents to specific users
- **Document Types**: Support different document types (policy, claim, manual, etc.)
- **Level 2 Agent Integration**: Documents will be searchable through the existing chatbot

## 📁 Files Structure

```
uploads/
├── pdf_processor.py          # Core PDF processing functionality
├── test_pdf_processing.py    # Test script for the system
├── requirements_pdf.txt      # Additional dependencies
└── README.md                # This file
```

## 🔧 Installation

### 1. Install Dependencies

```bash
pip install -r requirements_pdf.txt
```

### 2. Required Packages

- `PyPDF2==3.0.1` - PDF text extraction
- `pdfplumber==0.10.3` - Advanced PDF processing
- `langchain-text-splitters==0.0.1` - Text chunking

## 🎯 API Endpoints

### Upload PDF
```http
POST /api/upload/pdf
Content-Type: multipart/form-data

Parameters:
- file: PDF file
- user_id: User ID (optional)
- document_type: Type of document (default: "policy")
- Additional metadata fields
```

**Response:**
```json
{
  "message": "PDF processed successfully",
  "document_id": "doc_abc123def456",
  "chunk_count": 15,
  "text_length": 5420,
  "filename": "policy_document.pdf",
  "document_type": "policy"
}
```

## 💡 Usage Examples

### 1. Upload a Policy Document

```python
import requests

# Upload PDF
with open('policy_document.pdf', 'rb') as f:
    files = {'file': f}
    data = {
        'user_id': 'USR1000',
        'document_type': 'policy',
        'description': 'Auto insurance policy'
    }
    
    response = requests.post(
        'http://localhost:8001/api/upload/pdf',
        files=files,
        data=data
    )

print(response.json())
```

### 2. Using with Level 2 Agent (Future Integration)

The uploaded documents will be integrated with your existing Level 2 agent, allowing users to ask questions like:
- "Can you explain this term in my policy.pdf?"
- "What does my uploaded document say about coverage?"
- "Find information about deductibles in my documents"

## 🧪 Testing

### Run the Test Script

```bash
cd uploads
python test_pdf_processing.py
```

### Manual Testing

1. **Start your Flask app:**
   ```bash
   python app.py
   ```

2. **Upload a test PDF:**
   ```bash
   curl -X POST -F "file=@test_document.pdf" -F "user_id=USR1000" -F "document_type=policy" http://localhost:8001/api/upload/pdf
   ```

## 🔧 Configuration

### PDF Processor Settings

The PDF processor uses configurable paths from `config.py`:

```python
# In config.py
PDF_DB_PATH = os.path.join(BASE_DIR, "uploads", "pdf_vectors")
PDF_COLLECTION_NAME = "pdf_documents"

# In pdf_processor.py
PDFProcessor(
    pdf_db_path=config.PDF_DB_PATH,     # ChromaDB storage path (configurable)
    collection_name=config.PDF_COLLECTION_NAME,  # Collection name (configurable)
    chunk_size=1000,                    # Text chunk size
    chunk_overlap=200                   # Overlap between chunks
)
```

### Environment Variables

You can override the default paths using environment variables:

```bash
PDF_DB_PATH=/custom/path/to/pdf/vectors
PDF_COLLECTION_NAME=custom_pdf_collection
```

### Document Types

Supported document types:
- `policy` - Insurance policies
- `claim` - Claim documents
- `manual` - User manuals
- `regulation` - Regulatory documents
- `custom` - Custom document types

## 🎯 Integration with Existing System

### 1. ChromaDB Integration

Uses a separate ChromaDB database for PDF documents:
- Same embedding model (Google AI `models/embedding-001`)
- Separate database path: `uploads/pdf_vectors/`
- Separate collection: `pdf_documents`
- Independent from FAQ database for better organization

### 2. User Integration

Links documents to users in your existing system:
- Uses same user IDs
- Integrates with existing authentication
- Maintains user-specific document access

### 3. Level 2 Agent Integration (Future)

The uploaded documents will be integrated with your existing Level 2 agent through a new tool that will:
- Search user's uploaded documents
- Provide context for chatbot responses
- Allow natural language queries about documents

## 🚀 Deployment

### Local Development
1. Install dependencies
2. Start Flask app
3. Upload PDFs via API
4. Test search functionality

### Production Deployment
1. Ensure ChromaDB storage is persistent
2. Set up proper file upload limits
3. Configure document retention policies
4. Monitor vector database size

## 📊 Performance Considerations

### File Size Limits
- Recommended: < 10MB per PDF
- Maximum: 50MB (configurable)
- Large files may take longer to process

### Vector Storage
- Each PDF creates multiple vector chunks
- Storage grows with document count
- Consider cleanup policies for old documents

### Search Performance
- Vector search is fast for small collections
- Consider indexing for large document sets
- Monitor ChromaDB performance

## 🔒 Security

### File Validation
- Only PDF files accepted
- File size limits enforced
- Temporary files cleaned up

### User Access
- Documents linked to user IDs
- User-specific search filtering
- No cross-user document access

### Data Privacy
- PDFs processed in memory only
- No permanent file storage
- Only extracted text stored as vectors

## 🐛 Troubleshooting

### Common Issues

1. **PDF text extraction fails:**
   - Check if PDF is password protected
   - Try different PDF files
   - Verify PDF is not corrupted

2. **ChromaDB connection errors:**
   - Check storage path permissions
   - Ensure ChromaDB is properly initialized
   - Verify embedding model access

3. **Search returns no results:**
   - Check if documents were uploaded successfully
   - Verify user_id filtering
   - Try broader search terms

### Debug Mode

Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🔄 Future Enhancements

- **OCR Support**: Extract text from scanned PDFs
- **Image Processing**: Handle PDFs with images
- **Batch Upload**: Upload multiple PDFs at once
- **Document Versioning**: Track document updates
- **Advanced Search**: Filter by date, type, etc.
- **Export Features**: Export search results
- **Analytics**: Track document usage

---

*This PDF processing system seamlessly integrates with your existing insurance helpdesk, providing intelligent document search and Q&A capabilities.*
