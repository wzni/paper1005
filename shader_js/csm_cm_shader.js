"use strict";

var csm_cm_shader = new GShader(gl);
csm_cm_shader.load_vertex_shader(
 `#version 300 es
        in vec4 v0;
        in vec2 t0;
        in vec3 n0;
        uniform mat4 mvp;
        out vec2 bt;
        out vec3 bv;
        out vec3 bn;
        void main()
       {
          bt = t0;
          bv = v0.xyz;
          bn= n0;
          gl_Position = mvp*v0;
        }
     `);
csm_cm_shader.load_fragment_shader(
 `#version 300 es
precision highp float;
        #define PI 3.14159265358979
        #define M 4
        in vec2 bt;
        in vec3 bv;
        in vec3 bn;
        uniform vec3 l;
        uniform vec3 eyePos;
        uniform float zNear;
        uniform float zFar;
        uniform float lightsize;
        uniform sampler2D tex0;
        uniform samplerCube cmmap[M +1];
        uniform mat4 lightmv;
        uniform float shadow_a;
        uniform float shadow_b;
        uniform float tex_size;
        out vec4 color;


        #define fCSMBias 0.068 //0.068
        #define OFFSET 0.02 // max=0.05;
        #define SCALEFACTOR 1.11 //1.11
        #define ALPHA 0.06//0.06
        float supress_flag = 0.0;

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
        // return cube map mipmap look up result
        vec4 _f4mipmapCMMAP(samplerCube cmmap, vec3 uv, float fs)
            {
          vec4 result;
          uv = normalize(uv); // look up vector
          float W0 = tex_size;//float(textureSize(cmmap, 0).x);
          float ml = log(W0*fs) / log(2.0);
          result = textureLod(cmmap, uv, ml);
          return result;
}


vec4 f4mipmapCMMAP(samplerCube cmmap, vec3 uv, float fs)
{
  return _f4mipmapCMMAP(cmmap, uv, fs) *2.0-1.0;
}
        float CSSM_CM_Z_Basis(vec3 uv,
          float currentDepth,
          float filterwidth,
          samplerCube cmmap[M +1]
        ) {
          vec4 tmp, sin_val_z, cos_val_z;
          float sum0, sum1;
          float depthvalue = f4mipmapCMMAP(cmmap[0], uv, filterwidth).x;
          sin_val_z = f4mipmapCMMAP(cmmap[4], uv, filterwidth);
          cos_val_z = f4mipmapCMMAP(cmmap[3], uv, filterwidth);


          tmp = PI*vec4(1.0, 3.0, 5.0, 7.0);
          vec4 weights = getweights(ALPHA, 1.0, float(M));
          sum0 = dot(sin(tmp*(currentDepth -fCSMBias)) / tmp, cos_val_z*weights);
          sum1 = dot(cos(tmp*(currentDepth -fCSMBias)) / tmp, sin_val_z*weights);

          return 0.5*depthvalue +2.0*(sum0 -sum1);
            }


        //cube map basis
        float CSSM_CM_Basis(
          vec3 uv,
          float currentDepth,
          float filterwidth,
          samplerCube cmmap[M +1]
        ) {
          vec4 tmp, sin_val, cos_val;
          float sum0, sum1;

          sin_val = f4mipmapCMMAP(cmmap[2], uv, filterwidth);
          cos_val = f4mipmapCMMAP(cmmap[1], uv, filterwidth);

          tmp = PI*vec4(1.0, 3.0, 5.0, 7.0);
          vec4 weights = getweights(ALPHA, 1.0, float(M));
          sum0 = dot(cos(tmp*(currentDepth -fCSMBias)) / tmp, sin_val*weights);
          sum1 = dot(sin(tmp*(currentDepth -fCSMBias)) / tmp, cos_val*weights);


          float rec = 0.5 +2.0*(sum0 -sum1);

          if (supress_flag == 1.0)
            rec = SCALEFACTOR*(rec -OFFSET);

          return clamp((1.0*rec), 0.0, 1.0);
            }

        //cube map Find block depth
        float FindBlockDepth_CM(
          vec3 uv,
          float currentDepth,
          float distance,
          float lightsize,
          samplerCube cmmap[M +1],
          float zNear,
          float zFar
        ) {
          float fs = estimatefwo(lightsize, distance, zNear);

          fs = clamp(fs, 0.0, 2.0);

          supress_flag = 0.0;
          float blockedNum = 1.0 -CSSM_CM_Basis(uv, currentDepth, fs, cmmap);

          float Z_avg;
          if (blockedNum> 0.001)
            {
            Z_avg = CSSM_CM_Z_Basis(uv, currentDepth, fs, cmmap) / blockedNum;
            return Z_avg*zFar;
            }
            else
            {
            return 0.0;
            }

            }

        //cube map csm pcf filter
        float csm_cm_pcf_filter(
          vec3 uv,
          float currentDepth,
          float filterWidth,
          samplerCube cmmap[M +1]
        ) {
          supress_flag = 1.0;
          float shadow = CSSM_CM_Basis(uv, currentDepth, filterWidth, cmmap);
          return shadow;
            }


        //cube map soft shadow
        float CSM_CM_SoftShadow(
          vec3 uv,
          float currentDepth,
          float distance,
          float lightsize,
          samplerCube cmmap[M +1],
          float zNear,
          float zFar,
          float shadow_a,
          float shadow_b
        ) {
          float blockerdepth = FindBlockDepth_CM(uv, currentDepth, distance, lightsize, cmmap, zNear, zFar);

          if (distance == 0.0 || blockerdepth >= distance || blockerdepth == 0.0)
            return 1.0;

          float FilterWidth = estimatefwo(lightsize, distance, blockerdepth);

          float shadow = csm_cm_pcf_filter(uv, currentDepth, FilterWidth, cmmap);

          float temp = shadow_b*(blockerdepth -distance);

          float power = 1.0 +shadow_a* exp(temp);

         shadow = pow(shadow, power);

          return shadow;

}

      void main()
      {
            // color  = texture(tex0, bt);
            color =vec4(1.0);

            float d0, vb, distance;
            vec3 ldir;

            //for lighting
            vec3 eyeDir, reflectDir, lightDir, norm, h;
            float specular, diffuse;
            float light_dis, light_constant, light_linear, light_quad, light_atten;

            light_dis=length(l-bv);

            light_constant = 1.0;
            light_linear = 0.09;
            light_quad = 0.032;
            light_atten =clamp(1.0/(light_constant +light_linear*light_dis+light_quad*light_dis*light_dis), 0.0, 1.0);


            norm = normalize(bn);
            lightDir = normalize(l -bv);
            eyeDir = normalize(eyePos-bv);
            h= normalize(eyeDir+lightDir);

            //reflectDir = reflect(-lightDir, norm);
            specular = 0.5*pow(max(dot(norm, h), 0.0), 8.0);
            diffuse = 0.5 * max(dot(lightDir, norm), 0.0);


            ldir = bv -l;
            ldir =  (vec4(ldir, 1) * lightmv).xyz;
            distance = length(ldir);
            d0 = length(ldir) / zFar;
            vb =CSM_CM_SoftShadow(ldir, d0, distance, lightsize, cmmap, zNear, zFar, shadow_a, shadow_b);

            //gl_FragColor *= 0.5* max(dot(normalize(l -bv), normalize(bn)), 0.0) * vb;
            color.xyz = vec3(light_atten*(diffuse+specular) * vb);

            color.w=1.0;
            //gl_FragColor = _f4mipmapCMMAP(cmmap[3], ldir, 25025252525.0);// vec4(1.0);
            //gl_FragColor = textureCubeLodEXT(cmmap[3], ldir, lightsize*5.0);
          }
   `);
csm_cm_shader.link();
csm_cm_shader.add_attrib("v0");
csm_cm_shader.add_attrib("t0");
csm_cm_shader.add_attrib("n0");
csm_cm_shader.add_attrib_uniform("mvp");
csm_cm_shader.add_attrib_uniform("l");
csm_cm_shader.add_attrib_uniform("eyePos");
csm_cm_shader.add_attrib_uniform("zNear");
csm_cm_shader.add_attrib_uniform("zFar");
csm_cm_shader.add_attrib_uniform("lightsize");
csm_cm_shader.add_attrib_uniform("tex0");
csm_cm_shader.add_attrib_uniform("cmmap");
csm_cm_shader.add_attrib_uniform("tex_size");
csm_cm_shader.add_attrib_uniform("lightmv");
csm_cm_shader.add_attrib_uniform("shadow_a");
csm_cm_shader.add_attrib_uniform("shadow_b");
