import logging
import os

AUDIT_LOG_FILE = os.path.join(os.path.dirname(__file__), 'audit.log')
audit_logger = logging.getLogger("BACKOFFICE-TRE-AUDIT")
audit_logger.setLevel(logging.INFO)
audit_handler = logging.FileHandler(AUDIT_LOG_FILE, encoding='utf-8')
audit_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
audit_logger.addHandler(audit_handler)
