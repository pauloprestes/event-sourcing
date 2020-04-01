import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as bodyparser from 'koa-bodyparser';
import user from './routes/user'

const app = new Koa();
app.use(bodyparser());

const port = 8001;

const router = new Router()
  .use('/user', user.routes());

app.use(router.routes());
app.listen(port, () => {
  console.log(`Server is listening on http://0.0.0.0:${port}`);
});
