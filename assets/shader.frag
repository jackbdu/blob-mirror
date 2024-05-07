#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359
#define BODY_COORDS_NUM 14
#define BODY_COORD_LENGTH 5
#define BODIES_NUM 2

// Attributes passed from vertex shader.
varying vec2 vTexCoord;
// varying vec3 vColor;

// Main sketch variables.
uniform sampler2D uTexMap;
uniform vec2 uResolution;
uniform vec2 uTexDimensions;
uniform int uPixelDensity;
uniform int uFrameCount; // switch this to time later depending on priority
uniform int uLoopFramesNum; // minimum loop frames
uniform int uColorDepth;
uniform int uPixelationShortNum;
uniform int uMode;
uniform float uBodyCoords[BODY_COORDS_NUM*BODY_COORD_LENGTH*BODIES_NUM];
uniform float uLoopProgress; // progress repeats within normal range 0 to 1

vec4 toLuminance(vec4 inColor) {
  float grayVal = inColor.r * 0.21 + inColor.g * 0.71 + inColor.b * 0.07; // Luminance
  vec4 outColor = vec4(vec3(grayVal), inColor.a);
  return outColor;
}

vec4 toColorDepth(vec4 inColor, float colorDepth) {
  vec4 outColor = ceil(inColor * colorDepth)/colorDepth;
  return outColor;
}

vec4 addGlowingBody(vec4 inColor, vec2 resolution, float bodyCoords[BODY_COORDS_NUM*BODY_COORD_LENGTH*BODIES_NUM]) {
  // glowing
  //const float overallOffset = -4.0;
  //const float intensityFactor = 1.0;
  //const float partialIntensityFactor = 4.0;

  //const float overallOffset = -1.0;
  //const float intensityFactor = 50.0;

  const float overallOffset = -1.1;
  const float intensityFactor = 10.0;
  const float partialIntensityFactor1 = 42.0;
  const float partialIntensityFactor2 = 16.0;
  float shortSide = min(resolution.x, resolution.y);
  
  vec4 outColor = vec4(0.0);
  for (int i = 0; i < BODY_COORDS_NUM*BODY_COORD_LENGTH*BODIES_NUM; i += BODY_COORD_LENGTH) {
    float x = bodyCoords[i];
    float y = bodyCoords[i+1];
    float intensity = 1.0/bodyCoords[i+2]*intensityFactor;
    float meterValue = bodyCoords[i+3];
    float category = bodyCoords[i+4];
    vec2 bodyCoord = vec2(x + 0.5, 0.5 - y);
    vec2 scaledBodyCoord = bodyCoord * resolution;
    float distanceToBodyCoord = distance(scaledBodyCoord, gl_FragCoord.xy)/shortSide;
    if (category == 0.0) {
      distanceToBodyCoord -= meterValue/1.0;
    } else if (category == 1.0) {
      float partialIntensityOffset = -meterValue*partialIntensityFactor1;
      outColor.rg += pow(1.0/distanceToBodyCoord,1.0/(intensity+partialIntensityOffset)) + overallOffset;
    } else if (category == 2.0) {
      float partialIntensityOffset = -meterValue*partialIntensityFactor2;
      outColor.gb += pow(1.0/distanceToBodyCoord,1.0/(intensity+partialIntensityOffset)) + overallOffset;
    }
    outColor.rgb += pow(1.0/distanceToBodyCoord,1.0/(intensity)) + overallOffset;
  }
  outColor += inColor;
  outColor = vec4(clamp(outColor.rgb, 0.0, 1.0), outColor.a);
  return outColor;
}

vec4 colorFilter(vec4 inColor) {
  vec4 outColor = inColor;
  outColor.r -= 0.3;
  outColor.g -= 0.2;
  outColor.b -= 0.1;
  outColor = vec4(clamp(outColor.rgb, 0.0, 1.0), outColor.a);

  outColor.r += 0.5*sin(uLoopProgress*PI*2.0*1.0+1.0);
  outColor.g += 0.5*sin(uLoopProgress*PI*2.0*2.0+2.0);
  outColor.b += 0.5*sin(uLoopProgress*PI*2.0*3.0+3.0);
  outColor = vec4(clamp(outColor.rgb, 0.0, 1.0), outColor.a);
  return outColor;
}

vec4 invertColor(vec4 inColor) {
  vec4 outColor = vec4(1.0 - inColor.rgb, inColor.a);
  return outColor;
}

vec4 offsetColor(vec4 inColor, float offset) {
  vec4 outColor = vec4(inColor.rgb+offset, inColor.a);
  return outColor;
}

void main() 
{
  
  vec4 outColor = vec4(vec3(0.0), 1.0);
  
  // outColor = texture2D(uTexMap, vTexCoord);
  // outColor.rgb /= 16.0;
  
  outColor = addGlowingBody(outColor, uResolution * float(uPixelDensity), uBodyCoords);

  outColor = colorFilter(outColor);
  
  if (uMode != 0) {
    outColor = invertColor(outColor);
  }

  //outColor = offsetColor(outColor, uMode*1.0);

  // outColor = toLuminance(outColor);
  //outColor = toColorDepth(outColor, float(uColorDepth));

  gl_FragColor = outColor;
}
