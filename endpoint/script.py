from vist import create_app

app = create_app('develop', True)

if __name__ == '__main__':
    app.run()