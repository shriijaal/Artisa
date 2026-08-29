import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

KHALTI_REQUEST_TIMEOUT = 10  # seconds


def _get_base_url():
    return settings.KHALTI_BASE_URL.rstrip('/')


def _get_headers():
    return {
        'Authorization': f'Key {settings.KHALTI_SECRET_KEY}',
        'Content-Type': 'application/json',
    }


def initiate_khalti_payment(order_id, amount_in_rs, purchase_order_name, customer_info, return_url, product_details=None):
    """
    Initiate a Khalti ePayment.
    amount_in_rs: Decimal or float in Rupees. Khalti expects amount in Paisa, so we multiply by 100.
    """
    amount_in_paisa = int(float(amount_in_rs) * 100)

    payload = {
        'return_url': return_url,
        'website_url': settings.KHALTI_WEBSITE_URL,
        'amount': amount_in_paisa,
        'purchase_order_id': str(order_id),
        'purchase_order_name': purchase_order_name,
        'customer_info': {
            'name': customer_info.get('name', 'Artisa User'),
            'email': customer_info.get('email', ''),
            'phone': customer_info.get('phone', ''),
        },
    }

    if product_details:
        payload['product_details'] = product_details

    url = f'{_get_base_url()}/epayment/initiate/'
    try:
        response = requests.post(url, json=payload, headers=_get_headers(), timeout=KHALTI_REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        logger.error('Khalti initiate request timed out for order %s', order_id)
        return {'error_key': 'timeout', 'detail': 'Khalti API request timed out'}
    except requests.exceptions.HTTPError as e:
        logger.error('Khalti initiate HTTP error for order %s: %s', order_id, e)
        try:
            return e.response.json()
        except Exception:
            return {'error_key': 'http_error', 'detail': str(e)}
    except requests.exceptions.RequestException as e:
        logger.error('Khalti initiate request failed for order %s: %s', order_id, e)
        return {'error_key': 'connection_error', 'detail': str(e)}


def verify_khalti_payment(pidx):
    """
    Look up a Khalti payment status by pidx.
    Returns the Khalti response dict with keys: pidx, total_amount, status, transaction_id, fee, refunded.
    """
    payload = {'pidx': pidx}
    url = f'{_get_base_url()}/epayment/lookup/'

    try:
        response = requests.post(url, json=payload, headers=_get_headers(), timeout=KHALTI_REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        logger.error('Khalti lookup request timed out for pidx %s', pidx)
        return {'error_key': 'timeout', 'detail': 'Khalti API request timed out'}
    except requests.exceptions.HTTPError as e:
        logger.error('Khalti lookup HTTP error for pidx %s: %s', pidx, e)
        try:
            return e.response.json()
        except Exception:
            return {'error_key': 'http_error', 'detail': str(e)}
    except requests.exceptions.RequestException as e:
        logger.error('Khalti lookup request failed for pidx %s: %s', pidx, e)
        return {'error_key': 'connection_error', 'detail': str(e)}
