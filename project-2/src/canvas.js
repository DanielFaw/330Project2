/*
    The purpose of this file is to take in the analyser node and a <canvas> element: 
      - the module will create a drawing context that points at the <canvas> 
      - it will store the reference to the analyser node
      - in draw(), it will loop through the data in the analyser node
      - and then draw something representative on the canvas
      - maybe a better name for this file/module would be *visualizer.js* ?
*/

import * as utils from './utils.js';
import * as audio from './audio.js';

let ctx, canvasWidth, canvasHeight, gradient, analyserNode, audioData;

let counter1 = 255;
let counter2 = 255;
let counter3 = 255;
let value;

let currentTime;
let duration;


function setupCanvas(canvasElement, analyserNodeRef) {
    // create drawing context
    ctx = canvasElement.getContext("2d");
    canvasWidth = canvasElement.width;
    canvasHeight = canvasElement.height;
    // create a gradient that runs top to bottom
    gradient = utils.getLinearGradient(ctx, 0, 0, 0, canvasHeight, [
        { percent: 0, color: "black" },
        { percent: .25, color: "green" },
        { percent: .5, color: "black" },
        { percent: .75, color: "green" },
        { percent: 1, color: "black" }]);
    //	gradient = utils.getLinearGradient(ctx,0,0,0,canvasHeight,[{percent:0,color:"blue"},{percent:.25,color:"green"},{percent:.5,color:"yellow"},{percent:.75,color:"red"},{percent:1,color:"magenta"}]);
    // keep a reference to the analyser node
    analyserNode = analyserNodeRef;
    // this is the array where the analyser data will be stored
    audioData = new Uint8Array(analyserNode.fftSize / 2);
}

function draw(params = {}) {
    // 1 - populate the audioData array with the frequency data from the analyserNode
    // notice these arrays are passed "by reference" 

    if(params.showFreq)
    {
        analyserNode.getByteFrequencyData(audioData);
    }
    else
    {
        analyserNode.getByteTimeDomainData(audioData);
    }

    // 2 - draw background
    ctx.save();
    ctx.fillStyle = "black";
    ctx.globalAlpha = .1;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();

    // 3 - draw gradient
    if (params.showGradient) {
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.globalAlpha = .3;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
    }
    // 4 - draw bars
    if (params.showBars) {
        let barSpacing = 4;
        let margin = 5;

        //A lot of the bars just don't ever do anything, so im removing those
        let usedLength = (audioData.length - 32);

        let screenHeightForBars = canvasHeight - (usedLength * barSpacing) - margin * 2;
        let screenWidthForBars = canvasWidth - (usedLength * barSpacing) - margin * 2;
        let barWidth = screenWidthForBars / usedLength;
        let barHeight = (screenHeightForBars / usedLength) * 2;
        let barLength = 250;
        let topSpacing = 50;


        ctx.save();


        ctx.strokeStyle = `grba(0,0,0,0.50)`;
        

        for (let i = 0; i < usedLength; i++) {

            if(params.barColor == "fade")
            {
                ctx.fillStyle = utils.makeColor(audioData[i], audioData[i], audioData[i], .5);
            }
            else
            {
                ctx.fillStyle = params.barColor;
            }
            

            //Fill half on the left going right, half on the other side

            if (i < usedLength / 2) {
                //ctx.strokeRect(startingX, startingY, width, height)


                ctx.strokeRect(0, 2 + margin + i * (barHeight + barSpacing), topSpacing + audioData[i], barLength);
                ctx.fillRect(0, 2 + margin + i * (barHeight + barSpacing), topSpacing + audioData[i], barLength);
            }
            else {
                ctx.strokeRect(canvasWidth - (topSpacing + audioData[i]), (2 + margin + (i - usedLength / 2) * (barHeight + barSpacing)), topSpacing + audioData[i], barLength);
                ctx.fillRect(canvasWidth - (topSpacing + audioData[i]), (2 + margin + (i - usedLength / 2) * (barHeight + barSpacing)), topSpacing + audioData[i], barLength);
            }
            //ctx.strokeRect(margin + i * (barWidth + barSpacing), topSpacing + audioData[i], barWidth, barHeight);
            //ctx.fillRect(margin + i * (barWidth + barSpacing), topSpacing + audioData[i], barWidth, barHeight);

        }
        ctx.restore();
    }

    // 5 - draw circles


    if (params.showCircles) {

        //This circle changes its size based on the intensity of sound
        //It also flows between colors





        let usedLength = (audioData.length - 32);
        let maxRadius = canvasHeight / 4;
        ctx.save();
        //ctx.globalAlpha = 0.5;

        let base = 0;
        for (let i = 0; i < usedLength; i++) {
            base += audioData[i];
        }

        base /= usedLength;

        let percent = base / usedLength;


        //Randomize the colors a bit - using randomness and sine waves
        let amount = Math.random();
        value = utils.roundNear(Math.tan(amount * Math.PI * 2));

        if (amount < .34) {

            if (counter1 > 200) {
                counter1 -= Math.abs(value);

            }
            else if (counter1 < 50) {
                counter1 += Math.abs(value);
            }
            else {
                counter1 += value;
            }
        }
        else if (amount < .67) {

            if (counter2 > 200) {
                counter2 -= Math.abs(value);

            }
            else if (counter2 < 50) {
                counter2 += Math.abs(value);
            }
            else {
                counter2 += value;
            }
        }
        else {

            if (counter3 > 200) {
                counter3 -= Math.abs(value);

            }
            else if (counter1 < 50) {
                counter3 += Math.abs(value);
            }
            else {
                counter3 += value;
            }
        }


        if(params.circleColor == "fade")
        {
            ctx.fillStyle = utils.makeColor(counter1, counter2, counter3, 1);
        }
        else
        {
            ctx.fillStyle = params.circleColor;
        }



        let circleRadius = percent * maxRadius;
        ctx.beginPath();
        
        ctx.arc(canvasWidth / 2, canvasHeight / 2, circleRadius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    }


    

    /*Drawing the progress bar - always there, and always on top*/
    if (!audio.element.currentTime)
    { 
        currentTime= 0;
    }
    else
    {
        currentTime = audio.element.currentTime;
    }

    if(!audio.element.duration)
    {
        duration = 0;
    }
    else
    {
        duration = audio.element.duration;
    }

    //Make sure there are usable numbers for the progress bar
    if(currentTime != 0 && duration != 0)
    {
        let percentDone = currentTime / duration;
        let lineThick = 20;
        ctx.save();
        ctx.strokeStyle = "white";
        ctx.fillStyle = "magenta";
        ctx.beginPath();
        ctx.moveTo(0, canvasHeight - lineThick/2);
        ctx.lineTo(canvasWidth * percentDone, canvasHeight - lineThick/2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    // 6 - bitmap manipulation
    // TODO: right now. we are looping though every pixel of the canvas (320,000 of them!), 
    // regardless of whether or not we are applying a pixel effect
    // At some point, refactor this code so that we are looping though the image data only if
    // it is necessary

    // A) grab all of the pixels on the canvas and put them in the `data` array
    // `imageData.data` is a `Uint8ClampedArray()` typed array that has 1.28 million elements!
    // the variable `data` below is a reference to that array 
    let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    let data = imageData.data;
    let length = data.length;
    let width = imageData.width;

    if (params.showNoise) {


        // B) Iterate through each pixel, stepping 4 elements at a time (which is the RGBA for 1 pixel)
        for (let i = 0; i < length; i += 4) {

            // C) randomly change every 20th pixel to red
            if (params.showNoise && Math.random() < .01) {
                // data[i] is the red channel
                // data[i+1] is the green channel
                // data[i+2] is the blue channel
                // data[i+3] is the alpha channel
                // zero out the red and green and blue channels
                // make the red channel 100% red
                data[i] = 250;
                data[i + 1] = 250;
                data[i + 2] = 250;

            } // end if
        } // end for

        // D) copy image data back to canvas
        ctx.putImageData(imageData, 0, 0);
    }

    

    if (params.showMonochrome) {
        for (let i = 0; i < length; i+=4) {
            if (i % 4 == 3) continue; 

            let avg = (data[i] + data[i+1] + data[i+2])/3;
            data[i] = avg;
            data[i+1] = avg;
            data[i+2] = avg;
        }

        ctx.putImageData(imageData, 0, 0);
    }

    if (params.showInvert) {


        //data[i+3] is the alpha but we're leaving that alone

        for (let i = 0; i < length; i += 4) {
            let red = data[i], green = data[i + 1], blue = data[i + 2];
            data[i] = 255 - red;
            data[i + 1] = 255 - green;
            data[i + 2] = 255 - blue;
        }
        ctx.putImageData(imageData, 0, 0);
    }



}

export { setupCanvas, draw };