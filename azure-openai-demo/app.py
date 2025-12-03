"""
Flask Web Application for Azure OpenAI Demo
Provides REST API and web interface for AI services
"""

import os
import json
import logging
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, render_template, Response, stream_template
from flask_cors import CORS

# Import our custom services
try:
    from ai_service import AIService
    # from document_processor import DocumentProcessor  # Disabled for basic demo
    from config import config
except ImportError as e:
    print(f"Import error: {e}")
    print("Please install required packages: pip install -r requirements.txt")

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize services
ai_service = AIService()
# doc_processor = DocumentProcessor()  # Disabled for basic demo
doc_processor = None

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Allowed file extensions for document upload
ALLOWED_EXTENSIONS = {'txt', 'pdf'}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')


@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Chat completion endpoint
    Expected JSON: {"message": "user message", "stream": false}
    """
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        message = data['message']
        stream = data.get('stream', False)
        system_prompt = data.get('system_prompt')
        
        if stream:
            def generate():
                try:
                    for chunk in ai_service.chat_completion(
                        message=message,
                        system_prompt=system_prompt,
                        stream=True
                    ):
                        yield f"data: {json.dumps({'content': chunk})}\\n\\n"
                    yield f"data: {json.dumps({'done': True})}\\n\\n"
                except Exception as e:
                    yield f"data: {json.dumps({'error': str(e)})}\\n\\n"
            
            return Response(generate(), mimetype='text/plain')
        else:
            response = ai_service.chat_completion(
                message=message,
                system_prompt=system_prompt
            )
            
            return jsonify({
                'response': response,
                'timestamp': datetime.now().isoformat()
            })
    
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/summarize', methods=['POST'])
def summarize():
    """
    Document summarization endpoint
    Expected JSON: {"text": "document text", "max_length": 500}
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Text is required'}), 400
        
        text = data['text']
        max_length = data.get('max_length', 500)
        
        summary = ai_service.summarize_document(text, max_length)
        
        return jsonify({
            'summary': summary,
            'original_length': len(text),
            'summary_length': len(summary),
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Summarize endpoint error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/sentiment', methods=['POST'])
def sentiment():
    """
    Sentiment analysis endpoint
    Expected JSON: {"text": "text to analyze"}
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Text is required'}), 400
        
        text = data['text']
        result = ai_service.analyze_sentiment(text)
        
        return jsonify({
            'sentiment_analysis': result,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Sentiment endpoint error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/generate-code', methods=['POST'])
def generate_code():
    """
    Code generation endpoint
    Expected JSON: {"description": "what to code", "language": "python"}
    """
    try:
        data = request.get_json()
        if not data or 'description' not in data:
            return jsonify({'error': 'Description is required'}), 400
        
        description = data['description']
        language = data.get('language', 'python')
        
        code = ai_service.generate_code(description, language)
        
        return jsonify({
            'generated_code': code,
            'language': language,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Code generation endpoint error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/upload-document', methods=['POST'])
def upload_document():
    """
    Document upload for RAG
    Expects file in form data with key 'document'
    """
    try:
        if 'document' not in request.files:
            return jsonify({'error': 'No document file provided'}), 400
        
        file = request.files['document']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed. Use .txt or .pdf'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Document processing temporarily disabled
        return jsonify({
            'error': 'Document processing feature is temporarily disabled. Please install PyPDF2, langchain, and faiss-cpu packages for RAG functionality.',
            'filename': filename,
            'message': 'File uploaded but not processed'
        }), 501
    
    except Exception as e:
        logger.error(f"Upload document error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/ask-question', methods=['POST'])
def ask_question():
    """
    RAG-based question answering
    Expected JSON: {"question": "user question"}
    """
    try:
        data = request.get_json()
        if not data or 'question' not in data:
            return jsonify({'error': 'Question is required'}), 400
        
        question = data['question']
        # RAG functionality temporarily disabled
        return jsonify({
            'error': 'RAG functionality is temporarily disabled. Please install PyPDF2, langchain, and faiss-cpu packages.',
            'question': question
        }), 501
        
        return jsonify({
            'question': question,
            'answer': result['answer'],
            'sources': result['sources'],
            'confidence': result['confidence'],
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Ask question endpoint error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/document-stats', methods=['GET'])
def document_stats():
    """Get document processing statistics"""
    return jsonify({
        'error': 'Document processing statistics are temporarily disabled. Please install additional packages for RAG functionality.'
    }), 501


@app.route('/api/conversation', methods=['GET', 'DELETE'])
def conversation():
    """Get or clear conversation history"""
    try:
        if request.method == 'GET':
            summary = ai_service.get_conversation_summary()
            return jsonify({
                'conversation_summary': summary,
                'timestamp': datetime.now().isoformat()
            })
        
        elif request.method == 'DELETE':
            ai_service.clear_conversation()
            return jsonify({
                'message': 'Conversation history cleared',
                'timestamp': datetime.now().isoformat()
            })
    
    except Exception as e:
        logger.error(f"Conversation endpoint error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        # Test Azure OpenAI connection
        test_response = ai_service.chat_completion("Hello", max_tokens=10)
        
        return jsonify({
            'status': 'healthy',
            'azure_openai': 'connected',
            'timestamp': datetime.now().isoformat(),
            'test_response': test_response[:50] + '...' if len(test_response) > 50 else test_response
        })
    
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({'error': 'File too large. Maximum size is 16MB'}), 413


@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors"""
    logger.error(f"Internal server error: {e}")
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    # Create uploads directory
    os.makedirs('uploads', exist_ok=True)
    
    # Run the application
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(debug=debug_mode, host='0.0.0.0', port=5000)