from firebase_functions import https_fn, options
from flask import make_response, jsonify
from generate_report import build_report
import tempfile
import os

@https_fn.on_request(cors=options.CorsOptions(cors_origins="*", cors_methods=["GET", "POST"]))
def generatePdf(req: https_fn.Request) -> https_fn.Response:
    if req.method != 'POST':
        return (jsonify({'error': 'Method not allowed'}), 405)

    tmp_path = None
    try:
        data = req.get_json()
        if not data:
            return (jsonify({'error': 'No JSON data provided'}), 400)

        # Extract report and breakdown from request
        report = data.get('report', {})
        breakdown = data.get('breakdown', {})

        # Merge breakdown into report data for the PDF generator
        report['_breakdown'] = breakdown

        # Generate PDF to temp file
        tmp = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
        tmp_path = tmp.name
        tmp.close()

        build_report(report, tmp_path)

        # Read and return PDF bytes
        with open(tmp_path, 'rb') as f:
            pdf_bytes = f.read()
        response = make_response(pdf_bytes)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = 'attachment; filename=PathwayFinder-Report.pdf'
        return response

    except Exception as e:
        # Renderer errors may include applicant text. Log only the exception type.
        print(f"PDF generation error: {type(e).__name__}")
        return (jsonify({'error': 'The PDF could not be generated. Please try again.'}), 500)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
