// ****************************************************
// Globals
// ****************************************************

var gl;

var DEBUG = false;

// ****************************************************
// S9 Web GL 'Class' that defines everything
// ****************************************************

var S9WebGL = Class.create();

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
	},
	
	_draw : function() {
	    S9WebGL.draw();    
	}
	
};

S9WebGL.lastTime = 0;	
S9WebGL.elapsed = 0;

S9WebGL.initialize = function(){
    var canvas = $('webgl-canvas');	    
	    
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
      
        this.prototype._setupResources();
    } catch(e) {
    
    }
    
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
};


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
    
        this.resources.each(function(item) {
    
            new Ajax.Request(item[0],
            {
                method:'get',
                onSuccess: function(transport){
                    var response = transport.responseText;
                    if (response){
                        if (DEBUG) alert("Loaded " + item[0] + "\n\n");
                        ResourceLoader.nLoaded--;
                        
                       
                        var ro = item[2](response);
                       
                        ResourceLoader.resourceByTag[item[1]] = ro;
                        
                        if (ResourceLoader.nLoaded == 0)
                            S9WebGL.prototype._allIsLoaded();
                    }else{
                        alert('Data file ' + item[0] + 'was empty!');
                    
                    }     
                },
                onFailure: function(){ alert('AJAX Request for ' + item[0] + ' failed') }
            });            
        });
    },
    
    isReady : function() {
        return (this.nLoaded == 0);
    }
       
};


var RLBT = ResourceLoader.resourceByTag;

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


function linkShaders(rvertextag, rfragtag) {

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, RLBT[rvertextag] );
    gl.attachShader(shaderProgram, RLBT[rfragtag] );
    gl.linkProgram(shaderProgram);
    
    // Setting the locations!  Can we do this automagically?
    // potentially, when we read the shader text we could have "special" comments as 
    // really its just a text to text link?
    
    return shaderProgram;
}


// ****************************************************
// Handle Textures
// ****************************************************


function handleLoadedTexture(texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.bindTexture(gl.TEXTURE_2D, null);
}


// Load a texture from a file

function loadTexture(path) {
    var texture;
    texture = gl.createTexture();
    texture.image = new Image();
    texture.image.onload = function() {
        handleLoadedTexture(texture)
    }
    texture.image.src = path;
    return texture;
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


function setMatrixUniforms(shaderProgram) {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, new Float32Array(pMatrix.flatten()));
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, new Float32Array(mvMatrix.flatten()));

    var normalMatrix = mvMatrix.inverse();
    normalMatrix = normalMatrix.transpose();
    gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, new Float32Array(normalMatrix.flatten()));
}

// ****************************************************
// Primitive Models (cubes and spheres and such like)
// ****************************************************

function Primitive() {
    this.vertexPositionBuffer = gl.createBuffer();
    this.vertexNormalBuffer = gl.createBuffer();
    this.vertexTextureCoordBuffer = gl.createBuffer();
    this.vertexColorBuffer = gl.createBuffer();
    this.vertexIndexBuffer = gl.createBuffer();
    
    // I think this needs to be deleted and we simply have an override
    
    this.bindToShader = function (shaderProgram) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }
    
    this.draw = function () {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        gl.drawElements(gl.TRIANGLE_STRIP, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
 
    }
}

function createCube() {
    var cube = new Primitive;
   
    gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexPositionBuffer);
   
    vertices = [
      // Front face
      -1.0, -1.0,  1.0,
       1.0, -1.0,  1.0,
       1.0,  1.0,  1.0,
      -1.0,  1.0,  1.0,

      // Back face
      -1.0, -1.0, -1.0,
      -1.0,  1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0, -1.0, -1.0,

      // Top face
      -1.0,  1.0, -1.0,
      -1.0,  1.0,  1.0,
       1.0,  1.0,  1.0,
       1.0,  1.0, -1.0,

      // Bottom face
      -1.0, -1.0, -1.0,
       1.0, -1.0, -1.0,
       1.0, -1.0,  1.0,
      -1.0, -1.0,  1.0,

      // Right face
       1.0, -1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0,  1.0,  1.0,
       1.0, -1.0,  1.0,

      // Left face
      -1.0, -1.0, -1.0,
      -1.0, -1.0,  1.0,
      -1.0,  1.0,  1.0,
      -1.0,  1.0, -1.0,
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
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube.vertexIndices), gl.STATIC_DRAW);
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
    var radius = 1;
    
    var sphere = new Primitive;
    
    var vertexPositionData = [];
    var normalData = [];
    var textureCoordData = [];
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

    sphere.vertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphere.vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
    sphere.vertexNormalBuffer.itemSize = 3;
    sphere.vertexNormalBuffer.numItems = normalData.length / 3;

    sphere.vertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
    sphere.vertexTextureCoordBuffer.itemSize = 2;
    sphere.vertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

    sphere.vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphere.vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
    sphere.vertexPositionBuffer.itemSize = 3;
    sphere.vertexPositionBuffer.numItems = vertexPositionData.length / 3;

    sphere.vertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.vertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STREAM_DRAW);
    sphere.vertexIndexBuffer.itemSize = 1;
    sphere.vertexIndexBuffer.numItems = indexData.length;

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





