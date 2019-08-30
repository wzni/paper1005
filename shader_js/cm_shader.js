"use strict";

var cm_shader = new GShader(gl);
cm_shader.load_vertex_shader(
 `#version 300 es
        in vec4 v0;
        uniform mat4 mvp;
        out vec3 bc;
        void main()
        {
	        gl_Position = mvp*v0;
	        bc = v0.xyz;
        }
     `);
cm_shader.load_fragment_shader(
     `#version 300 es
    precision highp float;

    #define PI 3.14159265358979

    in vec3 bc;
    uniform vec3 l;
    uniform float zNear;
    uniform float zFar;

    layout(location = 0) out vec4 Frag0;
    layout(location = 1) out vec4 Frag1;
    layout(location = 2) out vec4 Frag2;
    layout(location = 3) out vec4 Frag3;
    layout(location = 4) out vec4 Frag4;

    void main()
{
      float depth = length(bc - l) / zFar;  // [0,1]
      Frag0 = vec4(depth, 1.0, 1.0, 1.0);  // [0,1]

      vec4 kv = PI*depth*vec4(1.0,3.0,5.0,7.0);
      Frag1 = cos(kv);      // [-1,1]
      Frag2 = sin(kv);      // [-1,1]
      Frag3 = depth*Frag1;  // [0,1]*[-1,1] = [-1,1]
      Frag4 = depth*Frag2;  // [0,1]*[-1,1] = [-1,1]

      Frag0 = (Frag0+1.0)/2.0;      // [0,1]
      Frag1 = (Frag1+1.0)/2.0;      // [0,1]
      Frag2 = (Frag2+1.0)/2.0;      // [0,1]
      Frag3 = (Frag3+1.0)/2.0;      // [0,1]
      Frag4 = (Frag4+1.0)/2.0;      // [0,1]

    }
     `);
cm_shader.link();
cm_shader.add_attrib("v0");
cm_shader.add_attrib_uniform("l");
cm_shader.add_attrib_uniform("mvp");
cm_shader.add_attrib_uniform("zNear");
cm_shader.add_attrib_uniform("zFar");
