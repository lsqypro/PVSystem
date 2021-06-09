from vist import create_app

app = create_app('develop')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9527)

    #context = ('/root/workspace/vist/cert/server.pem', '/root/workspace/vist/cert/server.key')
    #app.run(host='0.0.0.0', port=443, ssl_context=context)
    
    
