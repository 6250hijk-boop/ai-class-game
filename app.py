import webview

def main():
    # 독립된 데스크톱 앱 창으로 AI 클래스 게임 접속
    window = webview.create_window(
        title='AI 클래스 게임 (AI Class Game)',
        url='https://6250hijk-boop.github.io/ai-class-game/',
        width=1280,
        height=850,
        resizable=True,
        min_size=(900, 600)
    )
    webview.start()

if __name__ == '__main__':
    main()
