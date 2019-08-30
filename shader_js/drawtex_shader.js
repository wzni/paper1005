"use strict";

var drawtex_shader = new GShader(gl);
drawtex_shader.load_vertex_shader(
 `#version 300 es
in vec4 v0;
in vec2 t0;
uniform mat4 mvp;
out vec2 tc;
void main()
{
  gl_Position = mvp*v0;
  tc = t0;
}
`);
drawtex_shader.load_fragment_shader(
 `#version 300 es
precision highp float;
in vec2 tc;
uniform sampler2D tex0;
out vec4 color;
void main()
{
  color = vec4( texture(tex0, tc).xyz, 1.0 );
  // color = vec4(textureLod(tex0, tc, 5.5).xyz, 1.0);
}
`);
drawtex_shader.link();
drawtex_shader.add_attrib("v0");
drawtex_shader.add_attrib("t0");
drawtex_shader.add_attrib_uniform("tex0");
drawtex_shader.add_attrib_uniform("mvp");
