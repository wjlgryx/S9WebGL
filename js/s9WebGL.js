/*

  ________________________________________.___________    _______  ________ 
 /   _____/\_   _____/\_   ___ \__    ___/|   \_____  \   \      \/   __   \
 \_____  \  |    __)_ /    \  \/ |    |   |   |/   |   \  /   |   \____    /
 /        \ |        \\     \____|    |   |   /    |    \/    |    \ /    / 
/_______  //_______  / \______  /|____|   |___\_______  /\____|__  //____/  
        \/         \/         \/                      \/         \/       .co.uk


WebGL Template  v.1

s9WebGL.js

Benjamin Blundell

oni @ section9.co.uk

http://www.section9.co.uk
http://www.casa.ucl.ac.uk

Based on the excellent work by Giles over at http://learningwebgl.com/

This software is released under Creative Commons Attribution Non-Commercial Share Alike
http://creativecommons.org/licenses/by-nc-sa/3.0/

*/

// ****************************************************
// Globals
// ****************************************************

var gl;

var DEBUG = true;

// Debug mode does seem to have some side-effects!

// ****************************************************
// S9 Web GL 'Class' that defines everything
// ****************************************************

var S9WebGL = new Object();

// Possibly don't need to prototype but I'll leave it for now

S9WebGL.prototype = {

	_setupResources : function() {
	    S9WebGL.setupResources(); // This seems really bad! :P
	    ResourceLoader._load();
	},
    
    _allIsLoaded : function() {
        if (DEBUG){
            var str = "";
            for (var key in ResourceLoader.resourceByTag){
                str += key +  ":" + ResourceLoader.resourceByTag[key] + "\n";
            }
            alert(str);  
        }
        S9WebGL.preLoop();    
        setInterval(S9WebGL.prototype._tick, 15);
    },
    
	
	_tick : function() {
	    
	    var timeNow = new Date().getTime();
        if (S9WebGL.lastTime  != 0) {
            S9WebGL.elapsed = timeNow - S9WebGL.lastTime;
        }
        S9WebGL.lastTime  = timeNow;
	
	    S9WebGL.prototype._update();
	    S9WebGL.prototype._draw();   
	},
	
	_update : function () {
	    S9WebGL.update();
	    
	    // Technical these mouse elements may not exist yet
	    S9WebGL.mouseXprev = S9WebGL.mouseX;
        S9WebGL.mouseYprev = S9WebGL.mouseY; 
	},
	
	_draw : function() {
	    S9WebGL.draw();    
	}
	
};

S9WebGL.lastTime = 0;	
S9WebGL.elapsed = 0;

function throwOnGLError(err, funcName, args) {
  throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to" + funcName;
};


S9WebGL.initialize = function(){
    this.canvas = $("#webgl-canvas")[0];	    
	    
    try {
        if (DEBUG) gl = WebGLDebugUtils.makeDebugContext(this.canvas.getContext("experimental-webgl"));
        else gl = this.canvas.getContext("experimental-webgl");
        
        gl.viewportWidth = this.canvas.width;
        gl.viewportHeight = this.canvas.height;
      
        // Place holder for shaders
        this.shaders = new Array;
        this.activeShader = "none";

        // Add the mouse handler
        setMouseHandler();

       // OpenGL Constants        
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
       
        this.prototype._setupResources();
    } catch(e) {
        alert(e);
    }
    
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
};

S9WebGL.setActiveShader = function(tag) {
    var shader = S9WebGL.shaders[tag];
    S9WebGL.activeShader = tag;
    gl.useProgram(shader);
};


var $S = S9WebGL;

// ****************************************************
// Resource handling
// ****************************************************

// This handles all external things like shaders, models
// and textures

var ResourceLoader = {

    resources : new Array,
    nLoaded : 0, 
    resourceByTag: new Array,
    

	addVertexShader : function (path, tag) {
	    ResourceLoader._addResource(path,tag,ResourceLoader._addVertexShader);           
	},
	
	addFragmentShader : function (path, tag) {
	   ResourceLoader._addResource(path,tag,ResourceLoader._addFragmentShader);
	},
    
    addModel : function (path, tag) {
	    
	},
	
	addTexture : function (path, tag) {
	    var texImage = new Image();

        var texture = gl.createTexture();
        texture.image = texImage;
        texImage.src = path;
        this.nLoaded++;
        
        // SHOULD CHECK FOR RGB / RGBA here!
        
        texImage.onload = function() {
        
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.bindTexture(gl.TEXTURE_2D,texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);
         
            
            if (tag == undefined) tag = "r" + this.resources.length;
	        ResourceLoader.resources.push( [texture,tag] );
	        ResourceLoader.resourceByTag[tag] = texture;
	        
	        ResourceLoader._checkStatus();
        }
    },
    
    // Take the start of a path and add on at least 00 -> 05 for each!
    // currently, only takes GIFs
    
    addTextureCube : function (path, tag) {

        var texture = gl.createTexture();
      
        var texImages = new Array();
        
        var loadedTextures = 0;
      
        for (var i= 0; i < 6; ++i){
      
            texImages[i] = new Image();
            this.nLoaded++;
          
            texImages[i].cubeID = i;
                    
            texImages[i].onload = function() {
                
                loadedTextures ++;
                ResourceLoader._checkStatus();
                
                if (loadedTextures == 6){
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP,texture);
                    
                 
                    // Could really do with some mipmapping I think
                 
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                       
                    for (var j= 0; j < 6; ++j){
                        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + j, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texImages[j]);
                    }
                    
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
                }
                    
            }
            
            texImages[i].src = path + "_0" + i + ".gif";

        }
        
        if (tag == undefined) tag = "r" + this.resources.length;
        ResourceLoader.resources.push( [texture,tag] );
        ResourceLoader.resourceByTag[tag] = texture;
            
    },
    
    _checkStatus : function() {
        this.nLoaded--;
        $( "#progressbar" ).progressbar({
		    value: (this.nToLoad - this.nLoaded) / this.nToLoad * 100
        });
        if (this.nLoaded == 0){
            $( "#dialog-modal" ).dialog( "close" );
            $( "#progressbar" ).progressbar("destroy");
        }
    
    },
  

    _addVertexShader : function (response) {
        if (DEBUG) alert("Compiling Vertex Shader");
        return compileShader(response,"x-shader/x-vertex");
    },
    
    _addFragmentShader : function (response) {
        if (DEBUG) alert("Compiling Fragment Shader");
        return compileShader(response,"x-shader/x-fragment");
  
    },
    
    
	_addResource: function(path, tag, sfunc){
	    if (tag == undefined) tag = "r" + this.resources.length;
	    this.resources.push( [path,tag,sfunc] );
	    this.nLoaded++; 
    },
    
    _load : function () {
    
        // Only make AJAX Calls for things that aren't images
        // here is where we load the dialog for loading
        
        this.nToLoad = this.nLoaded;
        
        $( "#dialog" ).dialog( "destroy" );

        $( "#dialog-modal" ).dialog({
            height: 110,
            modal: true
        });
    
        $( "#progressbar" ).progressbar({
			value: 0
		});
    
        $.each(ResourceLoader.resources,function(index,item) {
          
            // cheat for now and assume that if the item is length 3 we are good to go 
            if (item.length == 3){
          
            // JQUERY HAS NO FAILURE method in its Ajax Class.... fail!
                $.ajax({
                    url: item[0],
                    success: function(data){
                     
                        if (data){
                            if (DEBUG) alert("Loaded " + item[0] + "\n\n");
                            ResourceLoader._checkStatus();
    
                            var ro = item[2](data);
                           
                            ResourceLoader.resourceByTag[item[1]] = ro;
                            
                            if (ResourceLoader.nLoaded == 0)
                                S9WebGL.prototype._allIsLoaded();
                        }else{
                            alert('Data file ' + item[0] + 'was empty!');
             
                        }     
                    },
                
                });
            }
        });

    },
    
    isReady : function() {
        return (this.nLoaded == 0);
    }
       
};

// Actual 'singleton' for handling things - maybe use a $R ?
var $R = ResourceLoader.resourceByTag;
var $RL = ResourceLoader;


// ****************************************************
// Shader Functions for loading and compiling
// ****************************************************

function compileShader (data, type) {

    if (type == "x-shader/x-fragment") {
        var shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "x-shader/x-vertex") {
        var shader = gl.createShader(gl.VERTEX_SHADER);
    } 
    if (shader){
        gl.shaderSource(shader, data);
        gl.compileShader(shader);
    
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return;
        }
        return shader;
    }
    else{
        alert("No Shader Object could be created!");
    }
    
}


function createShaders(rvertextag, rfragtag, tag) {

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, $R[rvertextag] );
    gl.attachShader(shaderProgram, $R[rfragtag] );
    gl.linkProgram(shaderProgram);
    
    // Setting the locations!  Can we do this automagically?
    // potentially, when we read the shader text we could have "special" comments as 
    // really its just a text to text link?
    
    // add Shader to our internal tracker
    if (tag == undefined) tag = "s" +  S9WebGL.shaders.length;
    S9WebGL.shaders[tag] =  shaderProgram;
    S9WebGL.activeShader = tag;
    
    return shaderProgram;
}


// ****************************************************
// Matrix Stacking and Settings Functions
// ****************************************************

// Apparently we don't get these by default? Seems odd!

var mvMatrix;
var mvMatrixStack = [];

function mvPushMatrix(m) {
    if (m) {
        mvMatrixStack.push(m.dup());
        mvMatrix = m.dup();
    } else {
        mvMatrixStack.push(mvMatrix.dup());
    }
}


function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
    return mvMatrix;
}

function loadIdentity() {
    mvMatrix = Matrix.I(4);
}


function multMatrix(m) {
    mvMatrix = mvMatrix.x(m);
}


function mvTranslate(v) {
    var m = Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4();
    multMatrix(m);
}

function createScaleMatrix(v) {
    return Matrix.Diagonal([v[0], v[1], v[2] , 1]);
}

function mvScale(v) {
    var m = createScaleMatrix(v).ensure4x4();
    multMatrix(m);    
}


function createRotationMatrix(angle, v) {
    var arad = angle * Math.PI / 180.0;
    return Matrix.Rotation(arad, $V([v[0], v[1], v[2]])).ensure4x4();
}

function mvRotate(angle, v) {
    multMatrix(createRotationMatrix(angle, v));
}
    
var pMatrix;
function perspective(fovy, aspect, znear, zfar) {
    pMatrix = makePerspective(fovy, aspect, znear, zfar);
}

// This function takes our OpenGL / Sylvester Matrices and creates something nice a shader can use
function setMatrixUniforms() {
    // Grab the Active Shader
    var shaderProgram = S9WebGL.shaders[S9WebGL.activeShader];
    
    if (shaderProgram != "none"){
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, new Float32Array(pMatrix.flatten()));
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, new Float32Array(mvMatrix.flatten()));
    
        var normalMatrix = mvMatrix.inverse();
        normalMatrix = normalMatrix.transpose();
        gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, new Float32Array(normalMatrix.flatten()));
        
        
        if (shaderProgram.nMatrixUniform != undefined){
            var normalMatrix = mvMatrix.inverse();
            normalMatrix = normalMatrix.transpose();
            gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, new Float32Array(normalMatrix.flatten()));
        }
    }
}


// ****************************************************
// Mouse and Keyboard interaction functions
// ****************************************************

// This function returns values between -1 and 1 with the origin
// at the center of the canvas


function setMouseHandler() {
    S9WebGL.mouseX = 0;
    S9WebGL.mouseY = 0;
    
    S9WebGL.mouseXprev = 0;
    S9WebGL.mouseYprev = 0;
    
    S9WebGL.mouseXstart = 0;
    S9WebGL.mouseYstart = 0;
    
    S9WebGL.mouseDown = false;

    $(S9WebGL.canvas).mousemove(function(event) {
        var vc = $(S9WebGL.canvas).position();
        S9WebGL.mouseX =   event.pageX - vc.left;
        S9WebGL.mouseY =   event.pageY - vc.top;
        
        S9WebGL.mouseX = S9WebGL.mouseX - (S9WebGL.canvas.width / 2); 
        S9WebGL.mouseY = S9WebGL.mouseY - (S9WebGL.canvas.height / 2); 
    
        S9WebGL.mouseX  /=   (S9WebGL.canvas.width / 2);
        S9WebGL.mouseY  /=   (S9WebGL.canvas.height / 2);    
   
    });
    
    $(S9WebGL.canvas).mousedown ( function () {
        S9WebGL.mouseDown = true;
        S9WebGL.mouseXstart = S9WebGL.mouseX;
        S9WebGL.mouseYstart = S9WebGL.mouseY;         
    });
    
    $(S9WebGL.canvas).mouseup ( function () {
        S9WebGL.mouseDown = false;         
    });   
   
}


// ****************************************************
// Primitive Models (cubes and spheres and such like)
// ****************************************************

function Primitive() {

    // Create a stack of buffers - we may not use them all

    this.vertexPositionBuffer       = gl.createBuffer();
    this.vertexNormalBuffer         = gl.createBuffer();
    this.vertexTextureCoordBuffer   = gl.createBuffer();
    this.vertexColorBuffer          = gl.createBuffer();
    this.vertexIndexBuffer          = gl.createBuffer();
    
    this.draw = function () {
    
        var shaderProgram = S9WebGL.shaders[S9WebGL.activeShader];
    
        if (shaderProgram != "none"){
    
            if (shaderProgram.textureCoordAttribute != -1 && shaderProgram.textureCoordAttribute != undefined) {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
                gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, this.vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }
            
            if (shaderProgram.vertexPositionAttribute != -1 && shaderProgram.vertexPositionAttribute != undefined) {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }
            
            if (shaderProgram.vertexNormalAttribute != -1 && shaderProgram.vertexNormalAttribute != undefined) {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, this.vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }
        
            if (shaderProgram.vertexColorAttribute != -1 && shaderProgram.vertexColorAttribute != undefined) {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColorBuffer);
                gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
            }
            
          
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
            setMatrixUniforms(shaderProgram);
            gl.drawElements(gl.TRIANGLES, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        }
    }
}

function createCuboid(width,height,depth) {
    var cube = new Primitive;
   
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexPositionBuffer);
   
    width /=2;
    height /=2;
    depth /=2;
     
    vertices = [
      // Front face
      -width, -height,  depth,
       width, -height,  depth,
       width,  height,  depth,
      -width,  height,  depth,

      // Back face
      -width, -height, -depth,
      -width,  height, -depth,
       width,  height, -depth,
       width, -height, -depth,

      // Top face
      -width,  height, -depth,
      -width,  height,  depth,
       width,  height,  depth,
       width,  height, -depth,

      // Bottom face
      -width, -height, -depth,
       width, -height, -depth,
       width, -height,  depth,
      -width, -height,  depth,

      // Right face
       width, -height, -depth,
       width,  height, -depth,
       width,  height,  depth,
       width, -height,  depth,

      // Left face
      -width, -height, -depth,
      -width, -height,  depth,
      -width,  height,  depth,
      -width,  height, -depth,
    ];
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    cube.vertexPositionBuffer.itemSize = 3;
    cube.vertexPositionBuffer.numItems = 24;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexNormalBuffer);
    var vertexNormals = [
      // Front face
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,

      // Back face
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,

      // Top face
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,

      // Bottom face
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,

      // Right face
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,

      // Left face
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
    ];
        
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
    cube.vertexNormalBuffer.itemSize = 3;
    cube.vertexNormalBuffer.numItems = 24;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexTextureCoordBuffer);
    var textureCoords = [
      // Front face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // Back face
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,

      // Top face
      0.0, 1.0,
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,

      // Bottom face
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,
      1.0, 0.0,

      // Right face
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,

      // Left face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    cube.vertexTextureCoordBuffer.itemSize = 2;
    cube.vertexTextureCoordBuffer.numItems = 24;
    

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.vertexIndexBuffer);
    var cubeVertexIndices = [
      0, 1, 2,      0, 2, 3,    // Front face
      4, 5, 6,      4, 6, 7,    // Back face
      8, 9, 10,     8, 10, 11,  // Top face
      12, 13, 14,   12, 14, 15, // Bottom face
      16, 17, 18,   16, 18, 19, // Right face
      20, 21, 22,   20, 22, 23  // Left face
    ]
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    cube.vertexIndexBuffer.itemSize = 1;
    cube.vertexIndexBuffer.numItems = 36;
    
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexColorBuffer);
    var colors = [
      [1.0, 0.0, 0.0, 1.0],     // Front face
      [1.0, 1.0, 0.0, 1.0],     // Back face
      [0.0, 1.0, 0.0, 1.0],     // Top face
      [1.0, 0.5, 0.5, 1.0],     // Bottom face
      [1.0, 0.0, 1.0, 1.0],     // Right face
      [0.0, 0.0, 1.0, 1.0],     // Left face
    ];
    var unpackedColors = []
    for (var i in colors) {
      var color = colors[i];
      for (var j=0; j < 4; j++) {
        unpackedColors = unpackedColors.concat(color);
      }
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
    cube.vertexColorBuffer.itemSize = 4;
    cube.vertexColorBuffer.numItems = 24;

    return cube;
}


function createSphere(latitudeBands,longitudeBands) {
    
    if (latitudeBands == undefined)     latitudeBands = 5;
    if (longitudeBands == undefined)  longitudeBands = 5;
    
    var radius = 1;
    
    var sphere = new Primitive;
    
    var vertexPositionData = [];
    var normalData = [];
    var textureCoordData = [];
    var colorData = [];
    
    for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
      var theta = latNumber * Math.PI / latitudeBands;
      var sinTheta = Math.sin(theta);
      var cosTheta = Math.cos(theta);

      for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
        var phi = longNumber * 2 * Math.PI / longitudeBands;
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);

        var x = cosPhi * sinTheta;
        var y = cosTheta;
        var z = sinPhi * sinTheta;
        var u = 1 - (longNumber / longitudeBands);
        var v = 1 - (latNumber / latitudeBands);

        normalData.push(x);
        normalData.push(y);
        normalData.push(z);
        
        colorData.push(1.0);
        colorData.push(1.0);
        colorData.push(1.0);
        colorData.push(1.0);
        
        textureCoordData.push(u);
        textureCoordData.push(v);
        vertexPositionData.push(radius * x);
        vertexPositionData.push(radius * y);
        vertexPositionData.push(radius * z);
      }
    }

    var indexData = [];
    for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
      for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
        var first = (latNumber * (longitudeBands + 1)) + longNumber;
        var second = first + longitudeBands + 1;
        indexData.push(first);
        indexData.push(second);
        indexData.push(first + 1);

        indexData.push(second);
        indexData.push(second + 1);
        indexData.push(first + 1);
      }
    }
 
    gl.bindBuffer(gl.ARRAY_BUFFER, sphere.vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
    sphere.vertexNormalBuffer.itemSize = 3;
    sphere.vertexNormalBuffer.numItems = normalData.length / 3;

    gl.bindBuffer(gl.ARRAY_BUFFER, sphere.vertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
    sphere.vertexTextureCoordBuffer.itemSize = 2;
    sphere.vertexTextureCoordBuffer.numItems = textureCoordData.length / 2;
 
    gl.bindBuffer(gl.ARRAY_BUFFER, sphere.vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
    sphere.vertexPositionBuffer.itemSize = 3;
    sphere.vertexPositionBuffer.numItems = vertexPositionData.length / 3;

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.vertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STREAM_DRAW);
    sphere.vertexIndexBuffer.itemSize = 1;
    sphere.vertexIndexBuffer.numItems = indexData.length;
    
    
    gl.bindBuffer(gl.ARRAY_BUFFER, sphere.vertexColorBuffer);
   
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData), gl.STATIC_DRAW);
    sphere.vertexColorBuffer.itemSize = 4;
    sphere.vertexColorBuffer.numItems = colorData.length;

    return sphere;

}

// ****************************************************
// Model Loading functions.
// ****************************************************

// A model is essentially a class with its own buffer objects
// doesnt differ much from a primitive but it will probably!

function Model() {
    this.vertexPositionBuffer = gl.createBuffer();
    this.vertexNormalBuffer = gl.createBuffer();
    this.vertexTextureCoordBuffer = gl.createBuffer();
    this.vertexIndexBuffer = gl.createBuffer();
    
    this.bindToShader = function (shaderProgram) {
          gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
          gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
          gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, this.vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
          gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
          gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, this.vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
          setMatrixUniforms();
          gl.drawElements(gl.TRIANGLES, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    
    this.draw = function () {
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexPositionBuffer.numItems);
    }
}

function handleLoadedModel(modelData) {
    
    var nm = new Model;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, nm.vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.vertexNormals), gl.STATIC_DRAW);
    laptopVertexNormalBuffer.itemSize = 3;
    laptopVertexNormalBuffer.numItems = modelData.vertexNormals.length / 3;

    gl.bindBuffer(gl.ARRAY_BUFFER, nm.vertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.vertexTextureCoords), gl.STATIC_DRAW);
    laptopVertexTextureCoordBuffer.itemSize = 2;
    laptopVertexTextureCoordBuffer.numItems = modelData.vertexTextureCoords.length / 2;

    gl.bindBuffer(gl.ARRAY_BUFFER, nm.vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.vertexPositions), gl.STATIC_DRAW);
    laptopVertexPositionBuffer.itemSize = 3;
    laptopVertexPositionBuffer.numItems = modelData.vertexPositions.length / 3;

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, nm.vertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelData.indices), gl.STREAM_DRAW);
    laptopVertexIndexBuffer.itemSize = 1;
    laptopVertexIndexBuffer.numItems = modelData.indices.length;
    
    return nm;
    
}

function loadModel(path) {
    var request = new XMLHttpRequest();
    request.open("GET", path);
    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            return handleLoadedModel(JSON.parse(request.responseText));
        }
    }
    request.send();
}





