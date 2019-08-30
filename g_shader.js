"use strict";

class GShader
{
	constructor(gl)
	{    
		this.gl = gl;
		this.program = gl.createProgram();
		this.vshader = null;
		this.fshader = null;
    this.linked = false;
	}
  load_vertex_shader(vs)
  {
    var gl = this.gl;
    this.vshader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(this.vshader, vs);
    gl.compileShader(this.vshader);
    var error = gl.getShaderInfoLog(this.vshader);
    if(error.length)
      throw error;
    gl.attachShader(this.program, this.vshader);
    this.linked = false;
  }
  load_fragment_shader(fs)
  {
    var gl = this.gl;
    this.fshader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(this.fshader, fs);
    gl.compileShader(this.fshader);
    var error = gl.getShaderInfoLog(this.fshader);
    if(error.length)
      throw error;
    gl.attachShader(this.program, this.fshader);
    this.linked = false;
  }
  record_shader_outputs(attrib_list)
  {
    this.gl.transformFeedbackVaryings(this.program, attrib_list, gl.INTERLEAVED_ATTRIBS);
  }

  link()
  {
    this.gl.linkProgram(this.program);
    this.linked = true;
         if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error(this.gl.getProgramInfoLog(this.program));
        }
 }
  add_attrib(str)
  {
    this[str] = this.gl.getAttribLocation(this.program, str);
    console.log(str + " " + this[str]);
  }
  add_attrib_uniform(str)
  {
    this[str] = this.gl.getUniformLocation(this.program, str);
  }
  use(str)
  {
    this.gl.useProgram(this.program);
  }
}

