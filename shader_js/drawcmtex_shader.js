"use strict";

var drawcmtex_shader = new GShader(gl);
drawcmtex_shader.load_vertex_shader(
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
drawcmtex_shader.load_fragment_shader(
 `#version 300 es
precision highp float;
in vec2 tc;
uniform mat4 mtc;
uniform samplerCube tex0;
out vec4 color;
void main()
{
  color = vec4( texture(tex0, (mtc*vec4(2.0*tc-1.0,1.0,1.0)).xyz ).xyz, 1.0 );
  // color = vec4( textureLod(tex0, (mtc*vec4(2.0*tc-1.0,1.0,1.0)).xyz, 1.0 ).xyz, 1.0 );
}
`);
drawcmtex_shader.link();
drawcmtex_shader.add_attrib("v0");
drawcmtex_shader.add_attrib("t0");
drawcmtex_shader.add_attrib_uniform("tex0");
drawcmtex_shader.add_attrib_uniform("mvp");
drawcmtex_shader.add_attrib_uniform("mtc");

