def HANDLER_NAME(body, req):
    name = req.query.get('name') or body.get('name') or 'World'
    return 'Hello {}!'.format(name)
