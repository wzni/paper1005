"use strict";

var csm_dp_shader = new GShader(gl);
csm_dp_shader.load_vertex_shader(
 `#version 300 es
        in vec4 v0;
        in vec2 t0;
        in vec3 n0;
        uniform mat4 mvp;
        out  vec2 bt;
        out  vec3 bv;
        out  vec3 bn;
        void main() {
          bt =t0;
          bv = v0.xyz;
          bn= n0.xyz;
          gl_Position = mvp*v0;
            }
    `);
csm_dp_shader.load_fragment_shader(
 `#version 300 es
 //#extension GL_EXT_shader_texture_lod: enable
        precision highp float;
        //precision mediump float
        #define PI 3.14159265358979
        #define M 4
        in vec2 bt;
        in  vec3 bv;
        in  vec3 bn;
        uniform vec3 l;
        uniform vec3 eyePos;
        uniform float zNear;
        uniform float zFar;
        uniform float lightsize;
        uniform sampler2D tex0;
        uniform sampler2D dpmap[2 * (M +1)];
        uniform mat4 lightmv;
        uniform float shadow_a;
        uniform float shadow_b;
        uniform float tex_size;

        #define fCSMBias 0.068
        #define OFFSET 0.02
        #define SCALEFACTOR 1.11
        #define ALPHA 0.06

        float supress_flag = 0.0;

        out vec4 FragColor;

        vec4 getweights(float alpha, float k, float m)
            {
          vec4 weights = vec4(exp(-alpha*(k) *(k) / (m*m)),
            exp(-alpha*(k +1.0) *(k +1.0) / (m*m)),
            exp(-alpha*(k +2.0) *(k +2.0) / (m*m)),
            exp(-alpha*(k +3.0) *(k +3.0) / (m*m)));
          return weights;
            }

        float estimateFilterWidth(float lightsize, float currentDepth, float blockerDepth)
            {   // receiver depth
          float receiver = currentDepth;
          float FilterWidth = (receiver -blockerDepth) *lightsize / (2.0 * currentDepth*blockerDepth);
          return FilterWidth;
            }

        float estimatefwo(float lightsize, float distance, float smpos)
            {
          float aa, bb, cc;
          aa = lightsize / distance;
          bb = lightsize / smpos;

          aa = clamp(aa, 0.0, 1.0);
          bb = clamp(bb, 0.0, 1.0);
          cc = aa*bb +sqrt((1.0 -aa*aa) *(1.0 -bb*bb));

          return sqrt(1.0 / (cc*cc) -1.0);
            }

        float fscm2dp(float ws)
        {
          ws = clamp(ws, 0.0, 2.0);
          if (ws<1.0)
            {
            ws /= sqrt(ws*ws +1.0) +1.0;
            }
            else
            {
            ws = 2.0 -ws;
            ws = sqrt(ws*ws +1.0) -ws;
            }
          return ws;
        }


    vec4 _f4mipmapDPMAP(sampler2D frontface, sampler2D backface, vec3 uv, float fs)
     {
          //vec4 cfront, cback, result;

          //convert the filterwidth from cube to dual paraboloid map
          fs = fscm2dp(fs);

          //convert the direction from cube to dp
          uv = normalize(uv);

          float W0 = tex_size;//float(textureSize(frontface, 0).x);
          float ml = log(W0*fs) / log(2.0);

          vec2 tc = vec2(uv.x, uv.y) / (1.0 +uv.z);
          vec2 coordf = vec2(-tc.x, tc.y) *.5+.5;
      //vec4 cfront= texture2DLodEXT(frontface, coordf.xy, ml);
      vec4 cfront= textureLod(frontface, coordf.xy, ml);
      //vec4 cfront= texture2D(frontface, coordf.xy, ml);
          tc = uv.xy / (1.0 -uv.z);
          vec2 coordb= tc*.5 +.5;
      //vec4 cback = texture2DLodEXT(backface, coordb.xy, ml);
      vec4 cback = textureLod(backface, coordb.xy, ml);
      //vec4 cback = texture2D(backface, coordb.xy, ml);
          float resolution = 1.0 / fs;
          float sss = clamp((length(uv.xy) / (1.0 +abs(uv.z)) -1.0) *resolution+1.0, 0.0, 1.0) * .5;

          if (uv.z<0.0)
            sss = 1.0 -sss;

          //seams
          /*
          if( uv.z<0 )
          return cback;
          else
          return cfront;
          */
          // delete seams//
          return mix(cfront, cback, sss);
  }

      vec4 f4mipmapDPMAP(sampler2D frontface, sampler2D backface, vec3 uv, float fs)
{
        vec4 result = _f4mipmapDPMAP(frontface, backface, uv, fs) *2.0-1.0;
         return result;
      }



        float CSSM_Z_Basis(vec3 uv,
          float currentDepth,
          float filterwidth
        ) {
          vec4 tmp, sin_val_z, cos_val_z;

          float sum0, sum1;
          float depthvalue = f4mipmapDPMAP(dpmap[0], dpmap[1], uv, filterwidth).x;
          sin_val_z = f4mipmapDPMAP(dpmap[5], dpmap[5+M], uv, filterwidth);
          cos_val_z = f4mipmapDPMAP(dpmap[4], dpmap[4+M], uv, filterwidth);

          tmp = PI*vec4(1.0, 3.0, 5.0, 7.0);
          vec4 weights = getweights(ALPHA, 1.0, float(M));
          sum0 = dot(sin(tmp*(currentDepth-fCSMBias)) / tmp, cos_val_z*weights);
          sum1 = dot(cos(tmp*(currentDepth-fCSMBias)) / tmp, sin_val_z*weights);

          return 0.5*depthvalue +2.0*(sum0 -sum1);
            }


        float CSSM_Basis(
          vec3 uv,
          float currentDepth,
          float filterwidth
        ) {
          vec4 tmp, sin_val, cos_val;

          float sum0, sum1;//= 0.0;

          sin_val = f4mipmapDPMAP(dpmap[3], dpmap[3 +M], uv, filterwidth);
          cos_val = f4mipmapDPMAP(dpmap[2], dpmap[2 +M], uv, filterwidth);

          tmp = PI*vec4(1.0, 3.0, 5.0, 7.0);
          vec4 weights = getweights(ALPHA, 1.0, float(M));

          sum0 = dot(cos(tmp*(currentDepth -fCSMBias)) / tmp, sin_val*weights); //+=
          sum1 = dot(sin(tmp*(currentDepth -fCSMBias)) / tmp, cos_val*weights);

          float rec = 0.5 +2.0*(sum0 -sum1);

          if (supress_flag == 1.0)
            rec = SCALEFACTOR*(rec -OFFSET);

          return clamp((1.0*rec), 0.0, 1.0);
            }


        float FindBlockDepth(
          vec3 uv,
          float currentDepth,
          float distance,
          float lightsize,
          float zNear,
          float zFar
        ) {
          float fs = estimatefwo(lightsize, distance, zNear);
          fs = clamp(fs, 0.0, 2.0);

          supress_flag = 0.0;
          float blockedNum = 1.0 -CSSM_Basis(uv, currentDepth, fs);
          //return blockedNum;

          float Z_avg;
          if (blockedNum> 0.001)
            {
            Z_avg = CSSM_Z_Basis(uv, currentDepth, fs) / blockedNum;
            return Z_avg*zFar;
            }
            else
            {
            return 0.0;
            }

            }

        //dual paraboloid map csm pcf filter
        float csm_pcf_filter(
          vec3 uv,
          float currentDepth,
          float filterWidth
        ) {
          supress_flag = 1.0;
          float shadow = CSSM_Basis(uv, currentDepth, filterWidth);
          return shadow;
            }


        float CSM_SoftShadow(
          vec3 uv,
          float currentDepth,
          float distance,
          float lightsize,
          float zNear,
          float zFar,
          float shadow_a,
          float shadow_b
        ) {
          float blockerdepth = FindBlockDepth(uv, currentDepth, distance, lightsize, zNear, zFar); 

          if (distance == 0.0 || blockerdepth >= distance || blockerdepth == 0.0)
            return 1.0;

          float FilterWidth = estimatefwo(lightsize, distance, blockerdepth);

          float shadow = csm_pcf_filter(uv, currentDepth, FilterWidth);

          float temp = shadow_b*(blockerdepth -distance);

          //temp=clamp(temp,0.0,shadow_b);

          float power = 1.0 +shadow_a* exp(temp);

          shadow = pow(shadow, power);//

          return shadow;
            }

       void main()
        {
            FragColor  = vec4(1.0); //texture(tex0, bt);
            float d0, vb, distance;
            vec3 ldir;


            //for lighting
            vec3 eyeDir, reflectDir, lightDir, norm,h;
            float specular, diffuse;
            float light_dis,light_constant, light_linear, light_quad, light_atten;

            light_dis=length(l-bv);

            light_constant = 1.0;
            light_linear = 0.09;
            light_quad = 0.032;
            light_atten =clamp( 1.0/(light_constant +light_linear*light_dis+light_quad*light_dis*light_dis),0.0,1.0);


            norm = normalize(bn);
            lightDir = normalize(l -bv);
            eyeDir = normalize(eyePos-bv);
            h= normalize(eyeDir+lightDir);

            //reflectDir = reflect(-lightDir, norm);
            specular = 0.5*pow(max(dot(norm,h),0.0), 8.0);
            diffuse = 0.5 * max(dot(lightDir, norm), 0.0);

            ldir = bv -l;
            ldir = (vec4(ldir, 1) * lightmv).xyz;
            distance = length(ldir);
            d0 = length(ldir) / zFar;
            vb = CSM_SoftShadow(ldir, d0, distance, lightsize, zNear, zFar, shadow_a, shadow_b);
            //FragColor.xyz = vec3(0.5 * max(dot(normalize(l -bv), normalize(bn)), 0.0) * vb);
            FragColor.xyz = vec3(light_atten*(diffuse+specular) * vb);
            FragColor.w= 1.0;
        }
     `);
csm_dp_shader.link();
csm_dp_shader.add_attrib("v0");
csm_dp_shader.add_attrib("t0");
csm_dp_shader.add_attrib("n0");
csm_dp_shader.add_attrib_uniform("mvp");
csm_dp_shader.add_attrib_uniform("l");
csm_dp_shader.add_attrib_uniform("eyePos");
csm_dp_shader.add_attrib_uniform("zNear");
csm_dp_shader.add_attrib_uniform("zFar");
csm_dp_shader.add_attrib_uniform("lightsize");
csm_dp_shader.add_attrib_uniform("tex0");
csm_dp_shader.add_attrib_uniform("dpmap");
csm_dp_shader.add_attrib_uniform("lightmv");
csm_dp_shader.add_attrib_uniform("shadow_a");
csm_dp_shader.add_attrib_uniform("shadow_b");
csm_dp_shader.add_attrib_uniform("tex_size");