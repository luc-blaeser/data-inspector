actor {
  stable let line = [{ var x = 1; var y = 2 }, { var x = 3; var y = 4 }, { var x = 5; var y = 6 }];
  stable let coloredLine = { line; var color = "blue" };

  public func change() : async () {
    for (point in line.vals()) {
      point.x += 1;
      point.y += 1;
    };
    if (coloredLine.color == "blue") {
      coloredLine.color := "red";
    } else {
      coloredLine.color := "blue";
    };
  };
};
