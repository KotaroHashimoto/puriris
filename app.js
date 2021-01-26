const ctx = canvas.getContext('2d');
ctx.strokeStyle = 'white';

class Figure {

    static SIZE = 40;

    constructor() {
        this.rotate = 0;
        this.cx = canvas.width / 2;
        this.cy = 20;
        this.py = Math.round(this.cy / Figure.SIZE) * Figure.SIZE;
        this.px = this.cx - (Figure.SIZE * this.cx);

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

            this.px = this.cx - (Figure.SIZE * x);
            if (this.px === 0) {
                this.leftBound = true;
            }
            if (this.px + Figure.SIZE === canvas.width) {
                this.rightBound = true;
            }

            ctx.drawImage(board.images[this.choice], this.px, this.py - (Figure.SIZE * y), Figure.SIZE, Figure.SIZE);
            this.rotated.push([this.px, this.py - (Figure.SIZE * y)]);
        }
    }

    move() {
        this.cy ++;
        this.py = Math.round(this.cy / Figure.SIZE) * Figure.SIZE;
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

        let audioElm = new Audio('pita.mp3');
        audioElm.loop = true;
        audioElm.autoplay = true;
        audioElm.play();

        this.fixedBlocks = {};
        const yp = canvas.height;
        this.fixedBlocks[yp] = [];
        for(let x = 0; x < canvas.width; x += Figure.SIZE) {
            this.fixedBlocks[yp].push([x, 0]);
        }

        this.cf = new Figure();

        window.addEventListener('keydown', (e) => {

            switch (e.key) {
                case "ArrowLeft":
                    if (!this.cf.leftBound) {
                        this.cf.cx -= Figure.SIZE;
                    }
                    break;
                case "ArrowRight":
                    if (!this.cf.rightBound) {
                        this.cf.cx += Figure.SIZE;
                    }
                    break;
                case "ArrowUp":
                    this.cf.rotate += 90;
                    break;
                case "ArrowDown":
                    this.cf.cy += Figure.SIZE;
                    break;
            }
        
            this.cf.rotate = this.cf.rotate % 360; 
        });

        document.getElementById("left-button").onclick = function() {
            if (!board.cf.leftBound) {
                board.cf.cx -= Figure.SIZE;
            }
        };
        document.getElementById("right-button").onclick = function() {
            if (!board.cf.rightBound) {
                board.cf.cx += Figure.SIZE;
            }
        };
        document.getElementById("up-button").onclick = function() {
            board.cf.rotate += 90;
        };
        document.getElementById("down-button").onclick = function() {
            board.cf.cy += Figure.SIZE;
        };
    }

    touched() {

        for(let [y, xs] of Object.entries(this.fixedBlocks)) {
            for (const xi of xs) {
                const x = xi[0];
                for(const [cx, cy] of this.cf.rotated) {
                    if ((parseInt(y) - cy === Figure.SIZE) & (cx === parseInt(x))) {

                        for(const [rx, ry] of this.cf.rotated) {
                            if (!(ry in this.fixedBlocks)) {
                                this.fixedBlocks[ry] = []
                            }
                            this.fixedBlocks[ry].push([rx, this.cf.choice]);
                        }

                        this.cf = new Figure();
                        return true;
                    }

                    if ((cy === parseInt(y)) & (cx - parseInt(x) === Figure.SIZE)) {
                        this.cf.leftBound = true;
                    }
                    if ((cy === parseInt(y)) & (parseInt(x) - cx === Figure.SIZE)) {
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
            if (xs.length === canvas.width / Figure.SIZE) {
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

            ctx.drawImage(this.images[7], 0, 0, canvas.width, canvas.width);
            await this.sleep(500);

            let tmp = {}
            for(const [y, xs] of Object.entries(this.fixedBlocks)) {
                tmp[y] = xs;
            }    

            this.fixedBlocks = {}
            for(let [y, xs] of Object.entries(tmp)) {
                if (y <= ey) {
                    if (tmp[y - Figure.SIZE]) {
                        this.fixedBlocks[y] = tmp[y - Figure.SIZE];
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
//                ctx.strokeRect(x, y, Figure.SIZE, Figure.SIZE);
                ctx.drawImage(board.images[xi[1]], xi[0], y, Figure.SIZE, Figure.SIZE);
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