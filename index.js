module.exports = function (babel) {
  const { types: t, template } = babel;
  return {
    name: "babel-plugin-transform-exec",
    visitor: {
      CallExpression(path) {
        const bindings = new Set();
        const scopes = new Set();
        if (path.node.callee.name !== "exec") return;

        // get top variable scope
        path.findParent((path) => {
          Object.keys(path.scope.bindings).forEach((e) => {
            bindings.add(path.scope.bindings[e]);
          });
          return path.isProgram();
        });

        const block = path.get("arguments.0.body");
        const execCb = path.get("arguments.0");

        // find scoped variables
        bindings.forEach((binding) => {
          binding.referencePaths.forEach((reference) => {
            const findInExec = reference.findParent((path) => path == block);
            if (findInExec) {
              scopes.add(reference.node.name);
            }
          });
        });

        // create second argument
        if (scopes.size) {
          let statement = "return {";
          scopes.forEach((val) => {
            statement += `${val},`;
          });
          statement += "}";

          const ast = template.ast(statement);
          // set execCb parameters
          if (execCb.node.params == 0) {
            execCb.node.params.push(t.identifier("_"));
          }
          execCb.node.params.push(ast.argument);
          path.node.arguments.push(ast.argument);
        }
      },
    },
  };
}
