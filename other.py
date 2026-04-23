import warnings


def inner(stacklevel: int) -> None:
    a = 1
    warnings.warn("Mensaje", stacklevel=stacklevel)
    b = 2


def outer(stacklevel: int) -> None:
    inner(stacklevel=stacklevel)


if __name__ == "__main__":
    outer(2)