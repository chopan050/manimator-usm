from pydantic import BaseModel

class RenderRequest(BaseModel):
    f_tex: str
    a_tex: str
    b_tex: str
    include_tangent: bool