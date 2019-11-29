const Game = function () {
    const color = "#0095DD"
    const canvas = document.getElementById('canvas')
    const context = canvas.getContext('2d')
    let interval = null
    this.score = 0
    this.lives = 99

    const addScore = function () {
        this.score++
    }.bind(this)

    const startHandtrack = function () {
        const video = document.getElementById("video");

        const modelParams = {
            maxNumBoxes: 1
        }



        let model = null

        function startVideo() {
            handTrack.startVideo(video).then(function (status) {
                if (status)
                    runDetection()
            });
        }

        function runDetection() {
            model.detect(video).then(predictions => {
                console.log('Predictions: ', predictions);
                if (predictions.length) {
                    const prediction = predictions[0];
                    paddle.x = prediction.bbox[0];
                }
                requestAnimationFrame(runDetection);
            });
        }

        handTrack.load(modelParams).then(lmodel => {
            model = lmodel
            console.log('Loaded Model!')
            startVideo()
        });
    }

    const getScore = function () {
        return this.score
    }.bind(this)

    const setLives = function (lives) {
        this.lives = lives
    }.bind(this)

    const getLives = function () {
        return this.lives
    }.bind(this)

    const displayWinMessage = function (bricksCount) {
        if (getScore() == bricksCount) {
            alert("YOU WIN, CONGRATULATIONS!")
            document.location.reload()
            clearInterval(interval)
        }
    }

    const drawLives = function () {
        context.font = '16px Arial'
        context.fillStyle = '#0095DD'
        context.fillText('Lives ' + this.lives, canvas.width - 65, 20)
    }.bind(this)

    const drawScore = function () {
        context.font = "16px Arial"
        context.fillStyle = "#0095DD"
        context.fillText("Score: " + this.score, 8, 20)
    }.bind(this)

    const endGame = function () {
        alert("GAME OVER")
        document.location.reload()
        clearInterval(interval)
    }

    const ball = {
        radius: 10,
        x: canvas.width / 2,
        y: canvas.height - 30,
        moveX: 2,
        moveY: -2,
        draw: function () {
            context.beginPath()
            context.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
            context.fillStyle = color
            context.fill()
        },

        bounce: function () {
            const canvasBoundaries = {
                maxX: this.x + this.moveX > canvas.width - this.radius,
                minX: this.x + this.moveX < this.radius,
                maxY: this.y + this.moveY > canvas.height - this.radius,
                minY: this.y + this.moveY < this.radius
            }

            if (canvasBoundaries.maxX || canvasBoundaries.minX)
                this.moveX = -this.moveX

            if (canvasBoundaries.minY)
                this.moveY = -this.moveY

            else if (canvasBoundaries.maxY) {
                if (this.x > paddle.x && this.x < paddle.x + paddle.width)
                    this.moveY = -this.moveY
                else {
                    const lives = getLives()
                    setLives(lives - 1)

                    if (!getLives())
                        endGame()
                    else {
                        ball.x = canvas.width / 2
                        ball.y = canvas.height - 30
                        ball.moveX = 3
                        ball.moveY = -3
                        paddle.x = (canvas.width - paddle.width) / 2
                    }
                }
            }
        },

        animate: function () {
            this.x += this.moveX
            this.y += this.moveY
            this.bounce()
        }
    }

    const paddle = {
        height: 10,
        width: 75,
        x: (canvas.width - 75) / 2,
        leftPressed: false,
        rightPressed: false,

        enableMovement: function () {
            function keyDownHandler(e) {
                if (e.key == 'Right' || e.key == 'ArrowRight') {
                    this.rightPressed = true
                }

                else if (e.key == 'Left' || e.key == 'ArrowLeft') {
                    this.leftPressed = true
                }
            }

            function keyUpHandler(e) {
                if (e.key === 'Right' || e.key === 'ArrowRight')
                    this.rightPressed = false

                else if (e.key === 'Left' || e.key === 'ArrowLeft')
                    this.leftPressed = false
            }

            const keyDownBindPaddle = keyDownHandler.bind(this)
            const keyUpBindPaddle = keyUpHandler.bind(this)

            document.addEventListener('keydown', keyDownBindPaddle, false)
            document.addEventListener('keyup', keyUpBindPaddle, false)
        },

        handleMovement: function () {
            if (this.rightPressed) {
                this.x += 7
                if (this.x + this.width > canvas.width)
                    this.x = canvas.width - this.width
            }
            else if (this.leftPressed) {
                this.x -= 7;
                if (this.x < 0) {
                    this.x = 0;
                }
            }
        },

        draw: function () {
            context.beginPath()
            context.rect(this.x, canvas.height - this.height, this.width, this.height)
            context.fillStyle = color
            context.fill()
            context.closePath()
        }
    }

    const bricks = {
        rowCount: 3,
        columnCount: 5,
        width: 75,
        height: 20,
        padding: 10,
        OffsetTop: 30,
        offsetLeft: 30,
        bricks: [],
        initiate: function () {
            for (var c = 0; c < this.columnCount; c++) {
                this.bricks[c] = []
                for (var r = 0; r < this.rowCount; r++) {
                    this.bricks[c][r] = { x: 0, y: 0, status: 1 }
                }
            }
        },

        draw: function () {
            for (var c = 0; c < this.columnCount; c++) {
                for (var r = 0; r < this.rowCount; r++) {
                    if (this.bricks[c][r].status === 1) {
                        var brickX = (c * (this.width + this.padding)) + this.offsetLeft
                        var brickY = (r * (this.height + this.padding)) + this.OffsetTop
                        this.bricks[c][r].x = brickX
                        this.bricks[c][r].y = brickY
                        context.beginPath()
                        context.rect(brickX, brickY, this.width, this.height)
                        context.fillStyle = color
                        context.fill()
                        context.closePath()
                    }
                }
            }
        },

        collisionDetection() {
            for (var c = 0; c < this.columnCount; c++) {
                for (var r = 0; r < this.rowCount; r++) {
                    var b = this.bricks[c][r]
                    if (b.status == 1) {
                        if (ball.x > b.x && ball.x < b.x + this.width &&
                            ball.y > b.y && ball.y < b.y + this.height) {
                            ball.moveY = -ball.moveY
                            b.status = 0
                            addScore()
                            displayWinMessage(this.rowCount * this.columnCount)
                        }
                    }
                }
            }
        }
    }

    this.end = endGame
    this.start = function () {
        startHandtrack()
        bricks.initiate()
        ball.draw()
        paddle.draw()
        paddle.enableMovement()
        interval = setInterval(function () {
            context.clearRect(0, 0, canvas.width, canvas.height)
            ball.draw()
            ball.animate()
            paddle.handleMovement()
            paddle.draw()
            bricks.collisionDetection()
            bricks.draw()
            drawScore()
            drawLives()
        }, 10)
    }
}

const game = new Game()
game.start()
