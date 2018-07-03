import requests
import json

url = "http://52.77.99.238:4000/jsonrpc"
headers = {'content-type': 'application/json'}

def main():

    # Example echo method
    payload = {
        "method": "price",
        "params": [],
        "jsonrpc": "2.0",
        "id": 0,
    }
    response = requests.post(
        url, data=json.dumps(payload), headers=headers).json()

    print(response)
### {u'jsonrpc': u'2.0', u'result': {u'price': u'0.00007800', u'next': 14506.508203}, u'id': 0}

    payload = {
        "method": "calc",
        "params": [0.1],
        "jsonrpc": "2.0",
        "id": 0,
    }
    response = requests.post(
        url, data=json.dumps(payload), headers=headers).json()

    print(response)
### {u'jsonrpc': u'2.0', u'result': {u'btc_amount': 0.1, u'imp_amount': 1282.051282}, u'id': 0}

    payload = {
        "method": "history",
        "params": ["i5mc1WwPZdfkYj5NKTiU1aDDKW2J3E3ZUV"],
        "jsonrpc": "2.0",
        "id": 0,
    }

    response = requests.post(
        url, data=json.dumps(payload), headers=headers).json()

    print(response)
### {u'jsonrpc': u'2.0', u'result': {u'imp_address': u'i5mc1WwPZdfkYj5NKTiU1aDDKW2J3E3ZUV', u'btc_addres': u'3JoGiD3v2sdtWbyafBnz4j5Gp7AArGU9af', u'history': {u'c53bf46992be980597bdcc118e76a2da100c23f8cabcb6c04cd5ab089af3f22a': {u'timestamp': 1529544143, u'btc_amount': 0.0001, u'imp_amount': 1.282051}}}, u'id': 0}

    payload = {
        "method": "register",
        "params": ["i5mc1WwPZdfkYj5NKTiU1aDDKW2J3E3ZUV"],
        "jsonrpc": "2.0",
        "id": 0,
    }
    response = requests.post(
        url, data=json.dumps(payload), headers=headers).json()

    print(response)
### {u'jsonrpc': u'2.0', u'result': {u'imp_address': u'i5mc1WwPZdfkYj5NKTiU1aDDKW2J3E3ZUV', u'btc_address': u'3JoGiD3v2sdtWbyafBnz4j5Gp7AArGU9af'}, u'id': 0}

if __name__=='__main__':
	main()

