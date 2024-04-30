// Built-in transformation matrices.
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;

// Mesh attributes.
attribute vec3 aPosition;
attribute vec2 aTexCoord;
// attribute vec3 aVertexColor;

// Main sketch variables.

// Attributes passed to fragment shader.
varying vec2 vTexCoord;
// varying vec3 vColor;

void main()
{
  // Copy the vec3 position into a vec4.
  vec4 position = vec4(aPosition, 1.0);
  
  // Set the clip space position.
  gl_Position = uProjectionMatrix * uModelViewMatrix * position;
  
  // Pass mesh attributes to fragment shader.
  vTexCoord = aTexCoord;
}
