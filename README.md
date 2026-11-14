# DesarrolloAplicacionesWeb
Repositorio del proyecto para la materia de Desarrollo de aplicaciones web

## Ramas

- `main` contiene las versiones estables del proyecto.
- `develop` contiene la versión de integración de las nuevas funcionalidades.
- `prototipo` contiene la versión integrada desde `develop` para realizar
  pruebas y validaciones antes de pasar a `main`.
- Cada integrante debe crear su propia rama **a partir de `develop`** antes de
  comenzar a trabajar.
- No se debe trabajar directamente sobre `main`, `develop` ni `prototipo`.
- Antes de crear una rama nueva, se debe actualizar la referencia local:

  ```bash
  git switch develop
  git pull origin develop
  git switch -c nombre-integrante
  ```

### Formato para nombres de ramas

Cada integrante debe utilizar una rama cuyo nombre sea únicamente su nombre y apellido,
escrito en minúsculas y sin espacios, acentos ni caracteres especiales:

```text
nombre-apellido
```

## Commits

Los mensajes de commit deben seguir el formato:

```text
tipo: descripcion breve en imperativo
```

El mensaje debe ser claro, breve y describir un solo cambio. Tipos permitidos:

- `feat`: nueva funcionalidad.
- `fix`: corrección de un error.
- `refactor`: modificación interna sin cambio funcional.
- `docs`: documentación.
- `style`: estilos o formato.
- `test`: pruebas.
- `chore`: tareas de mantenimiento.

Ejemplos:

```text
feat: agregar formulario de registro
fix: corregir validacion de campos vacios
docs: actualizar instrucciones de instalacion
```

## Pull requests

Para integrar cambios a `develop`, cada integrante debe crear un Pull Request
(PR) desde su rama de trabajo. Cuando los cambios de `develop` estén listos
para probarse, se creará otro PR de `develop` hacia `prototipo`.

El título del PR debe seguir el formato:

```text
tipo: descripcion breve del cambio
```

Cada PR debe:

1. Tener una descripción que explique qué se modificó y, si aplica, cómo se
   verificó.
2. Referenciar el issue o tarea relacionada.
3. Incluir únicamente cambios relacionados con la tarea.
4. Haber sido probado antes de solicitar la revisión.
5. Contar con al menos una revisión y aprobación de otro integrante.
6. Resolver los comentarios de revisión antes de realizar el merge.

Una vez aprobado, el PR de cada integrante se integrará a `develop`. Después de
validar la integración en `prototipo`, se podrá crear un PR de `prototipo` hacia
`main` para publicar una versión estable.

# Integrantes

| Nombre | Imagen |
|--------|--------|
| Diego Barak Cerón Rodríguez | <img src="medicitas/front/img/imgdiego.jpeg" width="169" height="300"> |
| Christian Alexander Vargas Llanes | <img src="medicitas/front/img/imgChristian.jpeg" width="109" height="300"> |
| Oscar de la Rosa García | <img src="medicitas/front/img/imgOscar.jpeg" width="200" height="150"> |
| Rolando Emmanuel Cabrera Dzul | <img src="medicitas/front/img/imgronnie.jpeg" width="170" height="250"> |
