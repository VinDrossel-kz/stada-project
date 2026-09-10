import Header from '../header';
import {requireChatGPTUser} from '../chatgpt-auth';
import {isOrganizer} from '../authorization';
import Editor from './editor';
export const dynamic='force-dynamic';
export default async function Admin(){const user=await requireChatGPTUser('/admin');const allowed=await isOrganizer();return <><Header/><main className="main admin-panel"><p className="eyebrow">ОРГАНИЗАТОРУ</p><h1>Баллы команд<span>.</span></h1>{allowed?<><p className="intro">Укажите итоговые баллы команды. После сохранения участники увидят новый результат.</p><p className="signed-in">Вы вошли как {user.email} · <a href="/signout-with-chatgpt?return_to=/">Выйти</a></p><Editor/></>:<div className="notice">Этот аккаунт может только просматривать результаты. Для изменения баллов войдите в аккаунт организатора.<p><a className="save-button" href="/signout-with-chatgpt?return_to=/admin">Сменить аккаунт</a></p></div>}</main></>}
