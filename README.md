# WebGL demo - paper1005

## Introduction
This program is the WebGL demo of the paper _Seamless Mipmap Filtering for Dual Paraboloid Maps_, which is accepted by the conference Pacific Graphics 2019. 

It demonstrates the omnidirectional soft shadows using dual paraboloid mapping and mipmapping. It is implemented using WebGL and _Three.js library_. The demo can be browsed with Chrome on any Android device with a decent GPU theorectically. 

![webgl_demo.png](https://github.com/wzni/paper1005/blob/master/webgl_demo.png)
Readers can browse the demo here [demo link](https://wzni.github.io/paper1005/) or by scanning the QR code.


## Content

This program contains eight folders, three _js_ files, a _html_ file and a _png_ file. Their roles are shown as follows.

### Folders

The folders _build_, _files_, _fonts_, _js_, _jsm_, _models_ and _nodes_ are taken form _Three.js library_. They contain the materials needed for the demo, such as the robot, the rings, the control bar, ect.

The folder _shader_js_ contains the GLSL shaders for the omnidirectional soft shadow generation. 
- cm_shader.js  
  It is used for generating the cubemap depth map.
  
- cm_cm_shader.js  
  It is used for generating the omnidirectional soft shadow with cubemap mipmaps.
  
- dp_shader.js  
  It is used for generating the dual paraboloid depth map.
  
- drawcmtex_shader.js  
  It is used for drawing the cubemap textures on the screen.
  
- drawtex_shader.js  
  It is used for drawing the dual paraboloid textures on the screen.
  
- genbasis_shader.js  
  It is used for generationg the CSM basis textures and CSM-Z basis textures in dual paraboloid map format.
  
- genbasis_shader_cm.js  
  It is used for generationg the CSM basis textures and CSM-Z basis textures in cubemap format.
 
### Files
  
- bezier_length.js <br />
  It is used for calculating the motion path of the robot when clicking the floor.
    
- g_shader.js <br />
  It is a shader class for manipulating the shaders.
    
- g_vector.js <br />
  It is a vector class for manipulating the vector data.
  
- index.html <br />
  It is the demo. 

- m4.js <br />
  It contains various 3d math functions for matrix and vector.
  
- webgl_demo.png <br />
  It is an illustrative figure of this demo which is shown above.

