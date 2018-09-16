import com.binaris.*;
import com.google.gson.JsonElement;

public class ExampleFunction implements BinarisFunction {
    public Object handle(JsonElement body, BinarisRequest request) {
        return "Hello, world";
    }
}
