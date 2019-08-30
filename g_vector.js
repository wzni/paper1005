"use strict";

class vec3
{
	constructor(x,y,z)
	{    
		this.x = x;
		this.y = y;
		this.z = z;
	}
  val(){ return [this.x,this.y,this.z]; }
  norm2() { return this.x * this.x + this.y * this.y + this.z * this.z; }
  norm() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
  sub(b) { return new vec3(this.x - b.x, this.y - b.y, this.z - b.z); }
  neg() { return new vec3(-this.x, -this.y, -this.z); }
  div(w) { return new vec3(this.x / w, this.y / w, this.z / w); }
  xmul(m) {
      var v = new vec3(
        this.x * m[0] + this.y * m[4] + this.z * m[8] + m[12],
        this.x * m[1] + this.y * m[5] + this.z * m[9] + m[13],
        this.x * m[2] + this.y * m[6] + this.z * m[10] + m[14]
        );
      v = v.div(this.x * m[3] + this.y * m[7] + this.z * m[11] + m[15]);
      return v;
  }
  mul(m) {
      var v = new vec3(
        this.x * m[0] + this.y * m[4] + this.z * m[8],
        this.x * m[1] + this.y * m[5] + this.z * m[9],
        this.x * m[2] + this.y * m[6] + this.z * m[10]
        );
      return v;
  }
}

function MouseOnSphere( x0, y0, width, height )
{
  var x, y, z, w;
  x = 2.0*(x0+.5)/width-1;
  y = 2.0*((height-y0-1)+.5)/height-1;
  w = x*x + y*y;

  if( w>1.0 ) 
  {
    var scale = 1.0/Math.sqrt(w);
    x *= scale; 
    y *= scale;
    z = 0.0;
  }else
  {
    z = Math.sqrt(1 - w);
  }

  return new vec3(x,y,z);
}

function vcross( a, b )
{
  var c = new vec3(0,0,0);
  c.x = a.y*b.z - b.y*a.z;
  c.y = -a.x*b.z + b.x*a.z;
  c.z = a.x*b.y - b.x*a.y;
  return c;
}

function vdot( a, b )
{
  return a.x*b.x + a.y*b.y + a.z*b.z;
}

function g_clamp( x, a, b )
{
  return x<a ? a : (x<b?x:b);  
}

function quat_mul( a, b )
{
  return [ a[0]*b[0], a[1]*b[1], a[2]*b[2], a[3]*b[3] ];
}

function quat_add( a, b )
{
  return [ a[0]+b[0], a[1]+b[1], a[2]+b[2], a[3]+b[3] ];
}

function quat_mul( a, b )
{
  if(a.length==null)
    return [ a*b[0], a*b[1], a*b[2], a*b[3] ];
  else if(b.length==null)
    return [ a[0]*b, a[1]*b, a[2]*b, a[3]*b ];
  else 
    return [
      a[3]*b[0] + a[0]*b[3] + a[1]*b[2] - a[2]*b[1],
      a[3]*b[1] - a[0]*b[2] + a[1]*b[3] + a[2]*b[0],
      a[3]*b[2] + a[0]*b[1] - a[1]*b[0] + a[2]*b[3],
      a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2],
    ];
}

function quat_norm(q)
{
  return Math.sqrt( q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3] );
}

function quat_normalize(q)
{
  return quat_mul( q, 1/quat_norm(q) );
}

function quat_vec(v0, v1)
{
  var axis, area, angle, len;
    axis = vcross( v0, v1 );
    area = axis.norm();
    len  = vdot( v0, v1 );
    len  = g_clamp( len, -1, 1 );
    angle = Math.acos(len);

  if( area==0 && len<0 )
  {
    if( Math.abs(v0.x)<Math.abs(v0.y) && Math.abs(v0.x)<Math.abs(v0.z) )
      axis = vcross( v0, new vec(1,0,0) );
    else if( Math.abs(v0.y)<Math.abs(v0.z) )
      axis = vcross( v0, new vec(0,1,0) );
    else
      axis = vcross( v0, new vec(0,0,1) );
    angle = acosf(-1);
  }

  var x,y,z,w, l;
  x = Math.sin(angle/2) * axis.x;
  y = Math.sin(angle/2) * axis.y;
  z = Math.sin(angle/2) * axis.z;
  w = Math.cos(angle/2);

  return quat_normalize([x,y,z,w]);

}

function quat2matrix( q )
{
  q = quat_normalize(q);
  var x, y, z, w;
  x = q[0];
  y = q[1];
  z = q[2];
  w = q[3];
  var xx, yy, zz;
  var xy, yz, zw;
  var xz, yw;
  var xw;

    xx = x*x;  yy = y*y;  zz = z*z;
    xy = x*y;  yz = y*z;  zw = z*w;
    xz = x*z;  yw = y*w;
    xw = x*w;
        
    var m = new Float32Array(16);

    m[0]  = 1 - 2 * ( yy + zz );
    m[1]  =     2 * ( xy - zw );
    m[2] = 2 * (xz + yw);
    m[3] = 0;

    m[4]  =     2 * ( xy + zw );
    m[5]  = 1 - 2 * ( xx + zz );
    m[6]  =     2 * ( yz - xw );
    m[7] = 0;

    m[8]  =     2 * ( xz - yw );
    m[9]  =     2 * ( yz + xw );
    m[10] = 1 - 2 * ( xx + yy );
    m[11] = 0;

    m[12] = 0;
    m[13] = 0;
    m[14] = 0;
    m[15] = 1;

    return m;
}

function quat_slerp( qa, qb, t )
{
  var sin_t, cos_t, theta;
  var sa, sb;

    qa = quat_normalize(qa);
    qb = quat_normalize(qb);

    cos_t = qa[3]*qb[3] + qa[0]*qb[0] + qa[1]*qb[1] + qa[2]*qb[2];
    cos_t = g_clamp( cos_t, -1,1 );
    sin_t = Math.sqrt(1-cos_t*cos_t);

	  //if theta = 0, a_b can be a, b, or any linearly combined vector between a and b
	  //if theta = 180, a_b can be any vector which is normal to a or b
	  //these two condition can be joint to one condition: a and b are in the same line.
    if ( Math.abs( sin_t ) < 0.0005 )
    {
      sa = 1-t;
      sb = t;
    }else
    {
      theta = Math.acos( cos_t );
      sa = Math.sin( theta * (1-t) )/sin_t;
      sb = Math.sin( theta * t )/sin_t;
    }

    return quat_add( quat_mul(qa,sa), quat_mul(qb,sb) );
}

function quatconj(q)
{
    return [-q[0], -q[1], -q[2], q[3]];
}

