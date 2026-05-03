
from pathlib import Path
from typing import Any

from manim import *
import sympy
from sympy.parsing.latex import parse_latex

Dot.set_default(num_components=4)


class ParametricCurveScene(ThreeDScene):
    def __init__(self, f_tex: str, a_tex: str, b_tex: str, *args: Any, **kwargs: Any):
        super().__init__(*args, **kwargs)

        # Parsear f_tex
        f_tex = f_tex.strip()
        if f_tex[1:4] == "(t)":
            f_tex = f_tex[4:].strip()[1:].strip()
            
        non_delimited_tex = f_tex
        for start, end in ["()", "[]", "<>"]:
            if f_tex.startswith(start) and f_tex.endswith(end):
                non_delimited_tex = f_tex[1:-1]
                break
            if f_tex.startswith(r"\left" + start) and f_tex.endswith(r"\right" + end):
                non_delimited_tex = f_tex[6:-7]
                break

        f_coord_texes = [tex.strip() for tex in non_delimited_tex.split(",")]

        self.f_tex = r"\left(" + r",\, ".join(f_coord_texes) + r"\right)"
        self.a_tex = a_tex.strip()
        self.b_tex = b_tex.strip()

        # Un "problema" con parse_latex (no siempre es problema) es que no convierte
        # automáticamente las constantes e, pi y tau a sus valores numéricos, sino que
        # las deja como símbolos. A veces es deseado, pero no en este caso.
        substitutions = {"e": np.e, "pi": PI, "tau": TAU}

        # Crear función f y dominio [a, b]
        f_coord_exprs: list[sympy.Expr] = [parse_latex(tex) for tex in f_coord_texes]
        f_coord_lambdas = [sympy.lambdify("t", expr.evalf(subs=substitutions)) for expr in f_coord_exprs]
        self.f = lambda t: [f_coord_lambda(t) for f_coord_lambda in f_coord_lambdas]
        self.a = float(parse_latex(a_tex).evalf(subs=substitutions))
        self.b = float(parse_latex(b_tex).evalf(subs=substitutions))

        df_dt_coord_exprs = [sympy.diff(expr, "t") for expr in f_coord_exprs]
        self.df_dt_tex = r"\left(" + r",\, ".join(sympy.latex(expr) for expr in df_dt_coord_exprs) + r"\right)"
        df_dt_coord_lambdas = [sympy.lambdify("t", expr.evalf(subs=substitutions)) for expr in df_dt_coord_exprs]
        self.df_dt = lambda t: [df_dt_coord_lambda(t) for df_dt_coord_lambda in df_dt_coord_lambdas]

        self.run_time = 8.0
        self.num_curve_mobjects = 5

        # Decidir si la escena es 2D o 3D
        point = self.f(self.a)
        self.dim = len(point)
        if self.dim not in (2, 3):
            raise ValueError(
                "El punto o vector retornado por la función debe ser 2D o 3D. "
                f"Actualmente, es {self.dim}D."
            )

        # self.num_curve_submobjects = 5

        # t_values = np.linspace(self.a, self.b, self.num_curve_submobjects * 60 + 1)
        # f_values = np.array([self.f(t) for t in t_values]) # arreglo de puntos que podrían ser 2D o 3D
        # min_point = np.min(f_values, axis=0)
        # max_point = np.max(f_values, axis=0)
        # mid_point = 0.5 * (min_point + max_point)
        # box_span = 1.5 * max(max_point - min_point)
        # ranges = [
        #     (mid_coord - 0.5 * box_span, mid_coord + 0.5 * box_span)
        #     for mid_coord in mid_point
        # ]

        # self.axes_config = dict(x_range=ranges[0], x_length=6, y_range=ranges[1], y_length=6)
        # if self.dim == 3:
        #     self.axes_config.update(dict(z_range=ranges[2], z_length=6, num_axis_pieces=1))
        
        # # Minimizar cantidad de curvas que pasan por los puntos
        # for num_curves_per_submobject in [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60]:
        #     points_approximated_by_curve = 4 * 60 // num_curves_per_submobject
        #     max_error = 0.0
        #     for submob_index in range(self.num_curve_submobjects):
        #         for curve_index in range(num_curves_per_submobject):
        #             pass

    def get_alpha(self, t: float | ValueTracker) -> float:
        if isinstance(t, ValueTracker):
            t = t.get_value()
        a, b = self.a, self.b
        return (t - a) / (b - a)

    def construct(self) -> None:
        self.set_camera_orientation(focal_distance=10.0)
        t_tracker = ValueTracker(self.a)

        rainbow = color_gradient(
            [RED, ORANGE.lighter(0.1), YELLOW_D, GREEN, BLUE],
            self.num_curve_mobjects,
        )

        f_tex = MathTex(
            rf"f'(t) &= {self.df_dt_tex} \\",
            rf"f(t) &= {self.f_tex} \\",
            rf"t &\in \left[{self.a_tex},\, {self.b_tex}\right]"
        )
        f_tex[0].set_opacity(0.0)
        if f_tex.width > 4.5:
            f_tex.scale_to_fit_width(4.5)

        interval = VGroup()
        interval.add(VGroup(Line(ORIGIN, 0.8*RIGHT).set_color(color) for color in rainbow).arrange(RIGHT, buff=0.0))
        interval.add(Line(0.15 * UP, 0.15 * DOWN).set_color(rainbow[0]).move_to(interval[0][0].get_start()))
        interval.add(interval[1].copy().set_color(rainbow[-1]).move_to(interval[0][-1].get_end()))
        interval.add(MathTex(self.a_tex).next_to(interval[1], DOWN))
        interval.add(MathTex(self.b_tex).next_to(interval[2], DOWN))
        for i in [3, 4]:
            if interval[i].width > 2.0:
                interval[i].scale_to_fit_width(2.0).next_to(interval[i-2], DOWN)
        
        t_dot_group = VGroup(
            Dot().set_color(YELLOW).scale(2),
            DecimalNumber(self.a),
        ).move_to(interval)

        VGroup(f_tex, interval).arrange(DOWN, buff=2.0).move_to(4 * LEFT)
        
        def update_t_dot(t_dot_group: VGroup) -> None:
            start, end = interval[0][0].get_start(), interval[0][-1].get_end()
            t = t_tracker.get_value()
            alpha = self.get_alpha(t)
            t_dot, decimal = t_dot_group
            t_dot.move_to(interpolate(start, end, alpha))
            # En vez de usar Mobject.become() que usa el método caro Mobject.copy(),
            # se usa este código más sucio, pero más rápido
            decimal.submobjects = []
            decimal.points = DecimalNumber(t).next_to(t_dot, UP).get_all_points()
        
        t_dot_group.add_updater(update_t_dot, call_updater=True)

        num_curves_per_submobject = 8
        t_values = np.linspace(self.a, self.b, num_curves_per_submobject * self.num_curve_mobjects + 1)
        f_values = np.array([self.f(t) for t in t_values])
        min_point = np.min(f_values, axis=0)
        max_point = np.max(f_values, axis=0)
        mid_point = 0.5 * (min_point + max_point)
        box_span = 1.5 * max(max_point - min_point)
        ranges = [
            (mid_coord - 0.5 * box_span, mid_coord + 0.5 * box_span)
            for mid_coord in mid_point
        ]
        axes_config = dict(x_range=ranges[0], x_length=6, y_range=ranges[1], y_length=6)
        if self.dim == 2:
            axes = Axes(**axes_config)
            axes.add(axes.get_axis_labels())
        else:
            axes_config.update(dict(z_range=ranges[2], z_length=6, num_axis_pieces=1))
            axes = ThreeDAxes(**axes_config)
            axes.add(axes.get_axis_labels())
            axes.scale(0.9).rotate(-TAU/4, RIGHT).rotate(-TAU/15, UP).rotate(TAU/12, RIGHT)

        axes.add_coordinates().move_to(2.5 * RIGHT)

        curve_template = VMobject().set_points_as_corners(axes.c2p(f_values)).make_smooth()
        curve = VGroup()
        for i, color in enumerate(rainbow):
            nppc = curve.n_points_per_curve
            start = nppc * i * num_curves_per_submobject
            end = nppc * (i + 1) * num_curves_per_submobject
            subcurve_points = curve_template.points[start:end]
            subcurve = VMobject().set_points(subcurve_points).set_stroke(color, opacity=1.0)
            curve.add(subcurve)
        
        f_dot = Dot().set_color(YELLOW).scale(2).set_z_index(1)

        def update_f_dot(f_dot: Dot) -> None:
            t = t_tracker.get_value()
            coords = self.f(t)
            position = axes.c2p(coords)
            f_dot.move_to(position)

        f_dot.add_updater(update_f_dot, call_updater=True)

        self.add(f_tex, interval, axes, t_tracker, t_dot_group, f_dot)

        self.wait()
        self.play(
            Create(curve),
            t_tracker.animate.set_value(self.b),
            run_time=self.run_time,
            rate_func=linear,
        )
        t_tracker.set_value(self.a)
        self.play(
            t_tracker.animate.set_value(self.b),
            run_time=self.run_time,
            rate_func=linear,
        )
        self.play(FadeOut(t_dot_group, f_dot), run_time=0.5)
        self.wait()

        self.play(f_tex[0].animate.set_opacity(1.0), run_time=0.5)
        self.wait()

        t_tracker.set_value(self.a)
        
        df_dt_arrow = Arrow(color=YELLOW)

        def update_df_dt_arrow(df_dt_arrow: Arrow) -> None:
            t = t_tracker.get_value()
            start = self.f(t)
            end = start + np.asarray(self.df_dt(t))
            df_dt_arrow.put_start_and_end_on(axes.c2p(start), axes.c2p(end))

        df_dt_arrow.add_updater(update_df_dt_arrow)
        
        self.play(FadeIn(t_dot_group, f_dot, df_dt_arrow), run_time=0.5)
        self.wait(0.5)

        self.play(
            t_tracker.animate.set_value(self.b),
            run_time=self.run_time,
            rate_func=linear,
        )
        self.wait()


def render_scene(f_tex: str, a_tex: str, b_tex: str) -> None:
    # f_tex = r"\cos(t), \sin(t), \frac{t}{2\pi}"
    # a_tex = r"0"
    # b_tex = r"3\pi"
    # f_tex = input("Ingrese una función sobre la variable t en formato LaTeX:\n")
    # a_tex = input("Ingrese límite inferior: ")
    # b_tex = input("Ingrese límite superior: ")

    cleaned_texes = [f_tex, a_tex, b_tex]
    for i in range(3):
        for symbols, replacement in [
            (['\\', '/', ':', '*', '?', '|', " ", "\\left", "\\right"], ""),
            (["<", "{"], "("),
            ([">", "}"], ")"),
        ]:
            for symbol in symbols:
                cleaned_texes[i] = cleaned_texes[i].replace(symbol, replacement)
    
    output_filename = f"curve_{cleaned_texes[0]}_[{cleaned_texes[1]},{cleaned_texes[2]}]"

    if not Path(f"/manim/media/videos/720p30/{output_filename}.mp4").exists():
        with tempconfig({"quality": "medium_quality", "output_file": output_filename}):
            ParametricCurveScene(f_tex, a_tex, b_tex).render()

    return f"/videos/{output_filename}.mp4"


if __name__ == "__main__":
    render_scene(
        r"\cos(t), \sin(t), \frac{t}{2\pi}",
        r"0",
        r"3\pi",
    )