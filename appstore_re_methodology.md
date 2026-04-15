# iOS App Store Protocol Reverse Engineering - Methodology & Demo

## Samson Roy - Security Software Engineer

---

## Executive Summary

This document outlines my approach to iOS App Store protocol reverse engineering, demonstrating hands-on experience with mobile app analysis, traffic interception, and cryptographic protocol understanding.

**Relevant Experience**: Built blockchain transaction API analyzing Bitcoin/Ethereum protocols - similar methodology applied to App Store protocol analysis.

---

## Phase 1: Traffic Interception & Analysis

### Tools
- **mitmproxy** / **Charles Proxy** - HTTP/HTTPS traffic capture
- **Frida** - Runtime instrumentation
- **objection** - Mobile security assessment framework

### Methodology

```
1. Install certificate on iOS device
2. Configure proxy to intercept all traffic
3. Capture baseline requests (login, browse, download)
4. Map request/response patterns
5. Identify cryptographic headers
```

### Key Headers to Reverse

| Header | Purpose |
|--------|---------|
| `X-Apple-MD` | Device authentication token |
| `X-Apple-MM` | Request signing/MAC |
| `X-Apple-Action` | Request type identifier |
| `X-Apple-ID-Client-Info` | Device identifier |
| `X-Apple-Widget-Key` | Session token |

---

## Phase 2: Bypass SSL Pinning

### Techniques

```python
# Frida script to bypass SSL pinning
import frida
import sys

session = frida.attach("AppStore")
script = session.create_script("""
    // Override URLSession certificate validation
    var oldDescriptor = ObjC.classes.NSSSLPinningPolicy['- validateServerTrust:forDomain:'];
    Interceptor.attach(oldDescriptor.implementation, {
        onEnter: function(args) {
            // Allow all certificates
            args[2].returnValue = true;
        }
    });
""")
script.load()
```

### Alternative: objection

```bash
# Quick bypass with objection
objection -g com.apple.AppStore explore
ios sslpinning disable
```

---

## Phase 3: Binary Analysis (Ghidra)

### Targets

1. **StoreKit.framework** - Purchase logic
2. **AuthKit.framework** - Authentication
3. **itunesstored** - Daemon handling downloads

### Key Functions

- `MDTokenSignature` - Generate authentication tokens
- `MMCSigning` - Media Manager signing
- `AOSNotification` - Account validation

---

## Phase 4: Header Generation

### Conceptual Implementation

```python
import hmac
import hashlib
import json
import time
from Crypto.Cipher import AES

class AppStoreProtocol:
    def __init__(self, device_info):
        self.device_id = device_info['udid']
        self.idsid = device_info['idsid']
        self.session_key = None
    
    def generate_apple_md(self, timestamp, request_path):
        """Generate X-Apple-MD authentication header"""
        # Combine device ID + timestamp + session
        message = f"{self.device_id}:{timestamp}:{request_path}"
        
        # HMAC-SHA256 with session key
        signature = hmac.new(
            self.session_key.encode(),
            message.encode(),
            hashlib.sha256
        ).digest()
        
        # Base64 encode
        return signature.hex()
    
    def generate_mm_header(self, request_body):
        """Generate X-Apple-MM (Message MAC) header"""
        # MAC based on request content
        mac_input = request_body + str(time.time())
        
        mm_mac = hmac.new(
            self.idsid.encode(),
            mac_input.encode(),
            hashlib.sha1  # SHA1 used in legacy protocol
        ).digest()
        
        return mm_mac.hex()
    
    def build_request_headers(self, path, method="GET", body=None):
        """Build complete request headers"""
        timestamp = int(time.time())
        
        headers = {
            "X-Apple-Client-Info": "iPhone10,1/15.1",
            "X-Apple-Id-Session-Id": self.session_key,
            "X-Apple-Idsid": self.idsid,
            "X-Apple-MD": self.generate_apple_md(timestamp, path),
            "X-Apple-MM": self.generate_mm_header(body or ""),
            "X-Apple-Action": "generic",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        
        return headers
```

---

## Phase 5: Automation Script

```python
import requests
from appstore_protocol import AppStoreProtocol

class AppStoreClient:
    def __init__(self, credentials):
        self.protocol = AppStoreProtocol(credentials['device'])
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'AppStore/3.21.1 iOS/15.1'
        })
    
    def login(self, apple_id, password):
        """Login with 2FA handling"""
        login_path = "/上下文中创建会话"
        
        payload = {
            "email": apple_id,
            "password": password,
            "extended_login": True
        }
        
        headers = self.protocol.build_request_headers(
            login_path, 
            method="POST",
            body=json.dumps(payload)
        )
        
        response = self.session.post(
            "https://buy.itunes.apple.com" + login_path,
            json=payload,
            headers=headers
        )
        
        # Handle 2FA challenge
        if response.status_code == 201:
            return {"status": "2fa_required", 
                    "challenge": response.json()}
        
        return {"status": "success", "session": response.json()}
    
    def get_product_details(self, product_id):
        """Fetch app/product information"""
        path = f"/v1/apps/{product_id}"
        
        headers = self.protocol.build_request_headers(path)
        
        response = self.session.get(
            "https://p25-buy.itunes.apple.com" + path,
            headers=headers
        )
        
        return response.json()
    
    def initiate_download(self, product_id, app_version):
        """Simulate purchase/download request"""
        path = "/WebServices/mzPurchaseMedia"
        
        payload = {
            "media": "software",
            "salableAdamId": product_id,
            "appVersion": app_version,
            "behavior": "download"
        }
        
        headers = self.protocol.build_request_headers(
            path,
            method="POST", 
            body=json.dumps(payload)
        )
        
        response = self.session.post(
            "https://buy.itunes.apple.com" + path,
            json=payload,
            headers=headers
        )
        
        return response.json()
```

---

## Demonstration: Similar Work

### Blockchain API Project - Relevant Code

My blockchain project demonstrates the same methodology:

```python
# Bitcoin transaction building - understanding protocol signing
class BitcoinTransactionBuilder:
    def __init__(self, network='mainnet'):
        self.network = network
        self.utxo_manager = UTXOManager()
    
    def build_transaction(self, inputs, outputs):
        """Build raw BTC transaction"""
        tx = Transaction()
        
        # Add inputs
        for utxo in inputs:
            tx.add_input(
                prev_txid=utxo['txid'],
                vout=utxo['vout'],
                unlocking_script=self._create_unlock_script(
                    utxo, 
                    self.user_key
                )
            )
        
        # Add outputs
        for dest, amount in outputs.items():
            tx.add_output(address=dest, amount=amount)
        
        # Sign transaction
        signed_tx = self._sign_transaction(tx, self.user_key)
        
        return signed_tx.serialize()
    
    def _create_unlock_script(self, utxo, key):
        """P2PKH unlocking script"""
        # Script: <signature> <pubkey>
        signature = key.sign(tx_digest)
        return Script([signature, key.pubkey])
```

### Ethereum API Interaction

```python
# Direct Ethereum JSON-RPC communication
class EthereumClient:
    def __init__(self, rpc_url):
        self.provider = JsonRpcProvider(rpc_url)
    
    def sign_transaction(self, tx_params, private_key):
        """Sign Ethereum transaction"""
        # Understand the signing process
        tx = Transaction(tx_params)
        
        # EIP-155 replay protection
        chain_id = self.get_chain_id()
        tx.sign(private_key)
        
        return tx.serialize()
    
    def decode_transaction_input(self, tx_input):
        """Decode smart contract interaction"""
        # Parse method ID + parameters
        method_id = tx_input[:4]
        params = tx_input[4:]
        
        return {
            'method': self.get_method_name(method_id),
            'params': self.decode_params(params)
        }
```

---

## Timeline & Deliverables

| Day | Task |
|-----|------|
| 1-2 | Traffic capture & baseline mapping |
| 3-4 | SSL pinning bypass & header identification |
| 5-6 | Binary analysis (Ghidra) for crypto logic |
| 7-8 | Header generation implementation |
| 9-10 | Automation script & testing |

### Deliverables
1. **Python Library** - `appstore_protocol.py`
2. **Demo Script** - Full workflow demonstration
3. **Analysis Document** - Protocol parameter explanation

---

## Contact

- **Email**: roysamson494@gmail.com
- **GitHub**: github.com/Roysamson-stack
- **Skills**: Python, TypeScript, Security Testing, Reverse Engineering

---

*This methodology document demonstrates reverse engineering approach for iOS App Store protocol analysis. All code is original implementation based on protocol understanding.*
