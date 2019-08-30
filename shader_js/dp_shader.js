"use strict";

var dp_shader = new GShader(gl);
dp_shader.load_vertex_shader(
 `#version 300 es
        in vec4 v0;
        uniform float zNear;
        uniform float zFar;
        uniform mat4 mvp;
        out vec3 bc;

        void main()
        {
	        // vec4 hp = ftransform();
	        vec4 hp = mvp * v0;

	        vec3 dp = normalize(hp.xyz);
	        float  ll = length(hp.xyz);
	        gl_Position.x =  dp.x / (dp.z+1.0);
	        gl_Position.y = -dp.y / (dp.z+1.0);

	        float focal_length = 0.04;
	        float dist_focus_to_parabolid =  focal_length * 2.0*ll / ( ll+ hp.z) ;
	        float dist_vertex_to_parabolid = ll - dist_focus_to_parabolid;

	        gl_Position.z = dist_vertex_to_parabolid + focal_length  - 1.0 ;
	        gl_Position.w = 1.0;

	        bc = v0.xyz;
        }
     `);
dp_shader.load_fragment_shader(
 `#version 300 es
        //#extension GL_EXT_draw_buffers: require
        precision highp float;
         //precision mediump float
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
          float depth = length(bc -l) / zFar;
          Frag0 = vec4(depth, 1.0, 1.0, 1.0);

          vec4 kv = PI*depth*vec4(1.0, 3.0, 5.0, 7.0);
          Frag1 = cos(kv);
          Frag2 = sin(kv);
          Frag3 = depth*Frag1;
          Frag4 = depth*Frag2;

          Frag0 = (Frag0+1.0) /2.0;      // [0,1]
          Frag1 = (Frag1+1.0) /2.0;      // [0,1]
          Frag2 = (Frag2+1.0) /2.0;      // [0,1]
          Frag3 = (Frag3+1.0) /2.0;      // [0,1]
          Frag4 = (Frag4+1.0) /2.0;      // [0,1]
        }

     `);
dp_shader.link();
dp_shader.add_attrib("v0");
dp_shader.add_attrib_uniform("l");
dp_shader.add_attrib_uniform("mvp");
dp_shader.add_attrib_uniform("zNear");
dp_shader.add_attrib_uniform("zFar");
