const ctx = canvas.getContext('2d');
ctx.strokeStyle = 'white';

let SIZE = 40;

class Figure {

    constructor() {

        this.rotate = 0;
        this.cx = canvas.width / 2;
        this.cy = 20;
        this.py = Math.round(this.cy / SIZE) * SIZE;
        this.px = this.cx - (SIZE * this.cx);

        this.leftBound = false;
        this.rightBound = false;

        this.choice = Math.round(Math.random() * 10000) % 7;
        if (this.choice === 0) {
            this.block = [[0, 0], [-1, 0], [1, 0], [0, 1]];
        }
        else if (this.choice === 1) {
            this.block = [[0, 0], [-1, 0], [-2, 0], [1, 0]];
        }
        else if (this.choice === 2) {
            this.block = [[0, 0], [-1, 0], [0, 1], [1, 1]];
        }
        else if (this.choice === 3) {
            this.block = [[0, 0], [-1, 0], [-1, -1], [0, -1]];
        }
        else if (this.choice === 4) {
            this.block = [[0, 0], [-1, 0], [-1, 1], [-1, 2]];
        }
        else if (this.choice === 5) {
            this.block = [[0, 0], [-1, 0], [-2, 0], [0, 1]];
        }
        else if (this.choice === 6) {
            this.block = [[0, 0], [1, 0], [2, 0], [0, 1]];
        }
    }

    draw() {

        this.leftBound = false;
        this.rightBound = false;
        this.rotated = [];

        for (let center of this.block) {

            let x = center[0];
            let y = center[1];
            const rot = Math.abs(this.rotate);
            if (rot === 90) {
                x = -1 * center[1];
                y = center[0];
            }
            else if (rot === 180) {
                x = -1 * center[0];
                y = -1 * center[1];
            }
            else if (rot === 270) {
                x = center[1];
                y = -1 * center[0];
            }

            this.px = this.cx - (SIZE * x);
            if (this.px === 0) {
                this.leftBound = true;
            }
            if (this.px + SIZE === canvas.width) {
                this.rightBound = true;
            }

            if (board.images[this.choice].complete) {
                ctx.drawImage(board.images[board.cf.choice], this.px, this.py - (SIZE * y), SIZE, SIZE);
            } else {
                board.images[this.choice].onload = function () {
                    ctx.drawImage(board.images[board.cf.choice], this.px, this.py - (SIZE * y), SIZE, SIZE);
                };
            }

            this.rotated.push([this.px, this.py - (SIZE * y)]);
        }
    }

    move() {
        this.cy ++;
        this.py = Math.round(this.cy / SIZE) * SIZE;
    }
}


class Board {

    constructor() {

        this.images = [];
        for (let i = 0; i < 7; i++) {
            let im = new Image();
            im.src = i.toString() + '.jpg';
            this.images.push(im);
        }
        let im = new Image();
        im.src = 'all.jpg';
        this.images.push(im);

        let audioElm = document.getElementById('starish');
        audioElm.loop = true;
        audioElm.autoplay = true;
        audioElm.volume = 0.2;
//        audioElm.play();
        audioElm.pause();

        this.fixedBlocks = {};
        const yp = canvas.height;
        this.fixedBlocks[yp] = [];
        for(let x = 0; x < canvas.width; x += SIZE) {
            this.fixedBlocks[yp].push([x, 0]);
        }

        this.cf = new Figure();

        window.addEventListener('keydown', (e) => {

            switch (e.key) {
                case "ArrowLeft":
                    if (!this.cf.leftBound) {
                        this.cf.cx -= SIZE;
                    }
                    break;
                case "ArrowRight":
                    if (!this.cf.rightBound) {
                        this.cf.cx += SIZE;
                    }
                    break;
                case "ArrowUp":
                    this.cf.rotate += 90;
                    break;
                case "ArrowDown":
                    this.cf.cy += SIZE;
                    break;
            }
        
            this.cf.rotate = this.cf.rotate % 360; 
        });

        document.getElementById("left-button").onclick = function() {
            if (!board.cf.leftBound) {
                board.cf.cx -= SIZE;
            }
        };
        document.getElementById("right-button").onclick = function() {
            if (!board.cf.rightBound) {
                board.cf.cx += SIZE;
            }
        };
        document.getElementById("up-button").onclick = function() {
            board.cf.rotate += 90;
        };
        document.getElementById("down-button").onclick = function() {
            board.cf.cy += SIZE;
        };
    }

    touched() {

        for(let [y, xs] of Object.entries(this.fixedBlocks)) {
            for (const xi of xs) {
                const x = xi[0];
                for(const [cx, cy] of this.cf.rotated) {
                    if ((parseInt(y) - cy === SIZE) & (cx === parseInt(x))) {

                        for(const [rx, ry] of this.cf.rotated) {
                            if (!(ry in this.fixedBlocks)) {
                                this.fixedBlocks[ry] = []
                            }
                            this.fixedBlocks[ry].push([rx, this.cf.choice]);
                        }

                        this.cf = new Figure();
                        return true;
                    }

                    if ((cy === parseInt(y)) & (cx - parseInt(x) === SIZE)) {
                        this.cf.leftBound = true;
                    }
                    if ((cy === parseInt(y)) & (parseInt(x) - cx === SIZE)) {
                        this.cf.rightBound = true;
                    }

                }
            }
        }

        return false;
    }

    lineToErase() {

        for(let [y, xs] of Object.entries(this.fixedBlocks)) {
            if(parseInt(y) === canvas.height) {
                continue;
            }
            if (xs.length === canvas.width / SIZE) {
                return parseInt(y);
            }
        }
        return null;
    }

    async erase() {

        let ey = this.lineToErase();
        if (ey) {
            const choice = Math.round(Math.random() * 10000) % 26;
            (new Audio(choice.toString() + '.mp3')).play();
        }

        while (ey) {

            if (this.images[7].complete) {
                ctx.drawImage(this.images[7], 0, 0, canvas.width, canvas.width);
            } else {
                this.images[7].onload = function () {
                    ctx.drawImage(this.images[7], 0, 0, canvas.width, canvas.width);
                };
            }

            await this.sleep(500);

            let tmp = {}
            for(const [y, xs] of Object.entries(this.fixedBlocks)) {
                tmp[y] = xs;
            }    

            this.fixedBlocks = {}
            for(let [y, xs] of Object.entries(tmp)) {
                if (y <= ey) {
                    if (tmp[y - SIZE]) {
                        this.fixedBlocks[y] = tmp[y - SIZE];
                    }
                }
                else if (ey < y) {
                    this.fixedBlocks[y] = tmp[y];
                }
            }    

            ey = this.lineToErase();
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    draw() {
        this.cf.draw();

        for(const [y, xs] of Object.entries(this.fixedBlocks)) {
            for (let xi of xs) {
                if (this.images[xi[1]].complete) {
                    ctx.drawImage(board.images[xi[1]], xi[0], y, SIZE, SIZE);
                } else {
                    this.images[xi[1]].onload = function () {
                        ctx.drawImage(board.images[xi[1]], xi[0], y, SIZE, SIZE);
                    };
                }    
            }
        }
    }
}

board = new Board();

async function main() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    board.cf.move();
    board.draw();
    if(board.touched()) {
        await board.erase();
    }
    
    window.requestAnimationFrame(main);
}

main();
